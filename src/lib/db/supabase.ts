import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  createAdminClient,
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/admin";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { cookies } from "@/lib/next/headers";
import {
  hashPassword,
  verifyPassword,
  signImpersonationValue,
  verifyImpersonationValue,
  generateAccountNumber,
  generateNumericCode,
} from "@/lib/db/security";
import { isCryptoMethod, maskPaymentMethodDetails } from "@/lib/db/masking";
import {
  logUndeliveredCode,
  passwordResetCodeEmail,
  verificationCodeEmail,
  depositApprovedEmail,
  withdrawalStatusEmail,
  broadcastEmail,
  testEmail,
  resolveEmailConfig,
  isEmailConfigured,
  sendMail,
  type EmailConfig,
  type MailInput,
} from "@/lib/mailer";

/** Read the admin-configured email settings (server-side only). */
async function loadEmailConfig(): Promise<EmailConfig> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("admin_config").select("value").eq("key", "email").maybeSingle();
    return resolveEmailConfig((data as { value?: EmailConfig } | null)?.value ?? null);
  } catch {
    return resolveEmailConfig(null);
  }
}

/** Send a prepared template to one recipient. Never throws. */
async function deliver(to: string, template: MailInput): Promise<boolean> {
  if (!to) return false;
  const cfg = await loadEmailConfig();
  if (!isEmailConfigured(cfg)) return false;
  const result = await sendMail(cfg, { ...template, to });
  return result.sent;
}

async function siteNameForEmail(): Promise<string> {
  try {
    const site = await resolveSite(undefined);
    return site?.name ?? "Online Banking";
  } catch {
    return "Online Banking";
  }
}
import { DbError } from "@/lib/db/error";
import { validateUpload } from "@/lib/db/upload";
import { parseAmountInput } from "@/lib/utils";
import type {
  Site,
  UserRow,
  Account,
  TransactionRow,
  CardRow,
  BeneficiaryRow,
  NotificationRow,
  DepositRow,
  WithdrawalRow,
  CardApplicationRow,
  LoanRow,
  GrantRow,
  SettingsRow,
  AdminCodeRow,
  PasswordResetRow,
  EmailVerificationRow,
  AuditLogRow,
  LeadRow,
  AdminTaskRow,
  ContactMessageRow,
  IrsRefundRow,
  MembershipRow,
  SiteCurrencyRow,
  FaqRow,
  TestimonialRow,
  PaymentMethod,
  SupportTicketRow,
  SupportMessageRow,
  KycRecord,
} from "@/lib/db/schema";

const PENDING_VERIFY_COOKIE = "sb_pending_verify";
const VERIFY_CODE_TTL_MS = 15 * 60 * 1000;

/* ------------------------------------------------------------------------- */
/* Static payment methods + in-memory support-ticket state                   */
/* ------------------------------------------------------------------------- */

const paymentMethodsList: PaymentMethod[] = [
  {
    id: "deposit_bank",
    name: "Bank Transfer",
    type: "deposit",
    emoji: "🏦",
    minimum: 100,
    maximum: 50000,
    charges_amount: 0,
    charges_type: "fixed",
    duration: "0-2 hours",
    custom_fields: [
      { id: "bank_name", label: "Bank Name", type: "text", role: "display", value: "Online Banking" },
      { id: "account_number", label: "Account Number", type: "text", role: "display", value: "4023391234" },
      { id: "reference", label: "Deposit Reference", type: "text", role: "input", required: false, placeholder: "Optional note" },
    ],
  },
  {
    id: "deposit_crypto",
    name: "Crypto Deposit",
    type: "deposit",
    emoji: "₿",
    minimum: 50,
    maximum: 100000,
    charges_amount: 1,
    charges_type: "percent",
    duration: "Network confirmations",
    custom_fields: [
      { id: "network", label: "Network", type: "select", role: "input", required: true, options: ["TRC20", "ERC20", "BEP20"] },
      { id: "coin", label: "Coin", type: "select", role: "input", required: true, options: ["BTC", "USDT", "ETH"] },
    ],
  },
  {
    id: "deposit_paypal",
    name: "PayPal",
    type: "deposit",
    emoji: "🅿",
    minimum: 20,
    maximum: 20000,
    charges_amount: 2.5,
    charges_type: "percent",
    duration: "Instant",
    instructions: "Please message the support team if you want to deposit money using this payment method.",
    custom_fields: [
      { id: "paypal_email", label: "PayPal Email", type: "text", role: "input", required: true, placeholder: "you@example.com" },
    ],
  },
  {
    id: "deposit_cash",
    name: "Cash Deposit",
    type: "deposit",
    emoji: "💵",
    minimum: 50,
    maximum: 10000,
    charges_amount: 0,
    charges_type: "fixed",
    duration: "Same day",
    instructions: "Please message the support team if you want to deposit money using this payment method.",
    custom_fields: [
      { id: "branch", label: "Branch / Location", type: "text", role: "input", required: true },
      { id: "teller_note", label: "Teller Note", type: "text", role: "input", required: false },
    ],
  },
  {
    id: "withdraw_bank",
    name: "Bank Transfer",
    type: "withdrawal",
    emoji: "🏦",
    minimum: 100,
    maximum: 25000,
    charges_amount: 2,
    charges_type: "percent",
    duration: "1-2 business days",
    custom_fields: [
      { id: "account_number", label: "Account Number / IBAN", type: "text", role: "input", required: true },
      { id: "bank_name", label: "Bank Name", type: "text", role: "input", required: true },
    ],
  },
  {
    id: "withdraw_crypto",
    name: "Crypto",
    type: "withdrawal",
    emoji: "₿",
    minimum: 50,
    maximum: 50000,
    charges_amount: 1.5,
    charges_type: "percent",
    duration: "Network confirmations",
    custom_fields: [
      { id: "network", label: "Network", type: "select", role: "input", required: true, options: ["TRC20", "ERC20", "BEP20"] },
      { id: "wallet_address", label: "Wallet Address", type: "text", role: "input", required: true },
    ],
  },
  {
    id: "withdraw_paypal",
    name: "PayPal",
    type: "withdrawal",
    emoji: "🅿",
    minimum: 20,
    maximum: 20000,
    charges_amount: 2.5,
    charges_type: "percent",
    duration: "Instant",
    custom_fields: [
      { id: "paypal_email", label: "PayPal Email", type: "text", role: "input", required: true, placeholder: "you@example.com" },
    ],
  },
  {
    id: "withdraw_wise",
    name: "Wise",
    type: "withdrawal",
    emoji: "💸",
    minimum: 20,
    maximum: 25000,
    charges_amount: 1,
    charges_type: "percent",
     duration: "1-2 business days",
     custom_fields: [
       { id: "wise_email", label: "Wise Email", type: "text", role: "input", required: true, placeholder: "you@example.com" },
     ],
   },
];

/* ------------------------------------------------------------------------- */
/* Helpers                                                                   */
/* ------------------------------------------------------------------------- */

function firstRow<T>(data: T[] | null): T | null {
  return data && data.length > 0 ? data[0] : null;
}

function mapUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    photo_url: row.photo_url ?? "",
    account_number: row.account_number ?? "",
    status: row.status,
    kyc_status: row.kyc_status,
    email_verified_at: row.email_verified_at,
    pin_gate: row.pin_gate,
    pin_set: Boolean(row.pin_hash),
    role: row.role,
    phone: row.phone,
    country: row.country ?? "US",
    currency: row.currency,
    twofa_enabled: row.twofa_enabled,
    mask_payment_details: row.mask_payment_details ?? false,
    full_name: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
    created_at: row.created_at,
  };
}

/** Resolve the site row for a slug (falls back to the default site). */
async function resolveSite(slug: string | undefined): Promise<Site> {
  const admin = createAdminClient();
  let query = admin.from("sites").select("*").limit(1).maybeSingle();
  if (slug) {
    query = admin.from("sites").select("*").eq("slug", slug).maybeSingle();
  }
  const { data, error } = await query;
  if (error) throw new DbError("site_error", error.message, 500);
  if (!data) throw new DbError("site_not_found", "Site not found.", 404);
  return data as Site;
}

/** Resolve the current authenticated user profile, or null.
 *  Honors a signed admin-impersonation cookie when present. */
async function currentUser(): Promise<UserRow | null> {
  // Admin impersonation: an httpOnly, HMAC-signed cookie set by the admin
  // impersonation endpoint takes precedence over any auth session.
  const jar = await cookies();
  const bimp = jar.getAll().find((c) => c.name.startsWith("bimp_"));
  const impersonatedId = verifyImpersonationValue(bimp?.value);
  if (impersonatedId) {
    const admin = createAdminClient();
    const { data } = await admin.from("users").select("*").eq("id", impersonatedId).maybeSingle();
    if (data) return data as UserRow;
  }

  const sb = await createServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("users").select("*").eq("id", user.id).maybeSingle();
  if (!data) return null;
  return data as UserRow;
}

/**
 * Admin starts an impersonation session for one member. Sets the signed
 * httpOnly cookie consumed by currentUser(); never touches passwords.
 */
async function startImpersonation(input: { id?: string }) {
  const actor = await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing user id.");
  const admin = createAdminClient();
  const { data: rows } = await admin.from("users").select("*").eq("id", input.id).limit(1);
  const target = firstRow(rows) as UserRow | null;
  if (!target) throw new DbError("not_found", "User not found.", 404);
  if (target.role === "admin") {
    throw new DbError("forbidden", "Admin accounts cannot be impersonated.", 403);
  }
  if (target.status === "disabled") {
    throw new DbError("account_disabled", "This account is disabled.");
  }

  const site = await resolveSite(undefined);
  const store = await cookies();
  store.set(`bimp_${site.id}`, signImpersonationValue(target.id), {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    partitioned: true,
    maxAge: 60 * 60 * 2, // 2 hours
  });
  await writeAudit({
    action: "impersonation.start",
    target_type: "user",
    target_id: target.id,
    target_label: target.email,
    details: { admin_email: actor.email },
  });
  return { ok: true, redirect: "/dashboard" };
}

/** Ends an impersonation session (clears the cookie) and audits it. */
async function endImpersonation() {
  const jar = await cookies();
  const bimp = jar.getAll().find((c) => c.name.startsWith("bimp_"));
  const targetId = verifyImpersonationValue(bimp?.value);
  if (bimp && targetId) {
    const admin = createAdminClient();
    const { data: tRows } = await admin.from("users").select("email").eq("id", targetId).single();
    const { data: aRows } = await admin
      .from("admin_codes")
      .select("user_id")
      .limit(0); // placeholder; actor email resolved below from audit context
    void aRows;
    const actor = await currentUser().catch(() => null);
    await writeAudit({
      action: "impersonation.end",
      target_type: "user",
      target_id: targetId,
      target_label: (tRows as { email?: string } | null)?.email,
      details: { admin_email: actor?.role === "admin" ? actor.email : null },
    });
  }
  await clearImpersonationCookies();
  return { ok: true };
}

/**
 * Remove every impersonation cookie. The cookie is set with
 * SameSite=None; Secure; Partitioned, so the expiry must repeat the exact same
 * attributes — otherwise the browser keeps the original cookie and the admin
 * stays "stuck" as the impersonated member after exiting.
 */
async function clearImpersonationCookies() {
  const store = await cookies();
  for (const c of store.getAll()) {
    if (!c.name.startsWith("bimp_")) continue;
    store.set(c.name, "", {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      partitioned: true,
      maxAge: 0,
      expires: new Date(0),
    });
  }
}

function mapTransaction(tx: TransactionRow) {
  return {
    id: tx.id,
    kind: tx.kind,
    // `direction` decides the +/- sign and colour everywhere in the UI, so it
    // must always be carried through to the client.
    direction: tx.direction ?? null,
    amount: tx.amount,
    currency: tx.currency,
    fee: tx.fee,
    reference: tx.reference,
    balance_after: tx.balance_after,
    status: tx.status,
    created_at: tx.created_at,
    name: tx.name,
    meta: tx.name ? { label: tx.name } : undefined,
  };
}


function mapCard(card: CardRow) {
  return {
    id: card.id,
    card_brand: card.brand as "visa" | "mastercard",
    card_number_masked: `•••• ${card.last4}`,
    expires_at: card.expiry,
    balance: Number(card.limit_amount ?? 0) - Number(card.spent),
    currency: "USD",
    status: card.frozen ? "frozen" : card.status,
  };
}

function transferConfigDefaults() {
  return { transfer_charges: 1.5, min_transfer: 10, max_transfer: 25000 };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

async function checkPin(user: UserRow, pin?: string) {
  if (!pin || !/^\d{4,6}$/.test(pin) || !user.pin_hash) {
    throw new DbError("pin_not_set", "You must set a transaction PIN before sending money.");
  }
  if (!(await verifyPassword(pin, user.pin_hash))) {
    throw new DbError("bad_pin", "Incorrect PIN.");
  }
}

/* ------------------------------------------------------------------------- */
/* Public / authenticated (bankFetch)                                        */
/* ------------------------------------------------------------------------- */

async function siteInfo(slug?: string) {
  return { site: await resolveSite(slug) };
}

async function me(slug?: string) {
  const [site, user] = await Promise.all([resolveSite(slug), currentUser()]);
  if (!user) throw new DbError("unauthenticated", "Not signed in.", 401);
  const jar = await cookies();
  const impersonating = jar.getAll().some((c) => c.name.startsWith("bimp_"));
  return { site, user: mapUser(user), impersonating };
}

async function balances() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb
    .from("accounts")
    .select("currency, balance, available")
    .eq("user_id", user.id);
  return {
    balances: (data ?? []).map((a) => ({
      currency: a.currency,
      amount: a.balance,
      // `available` excludes money reserved by pending withdrawals/transfers.
      available: a.available ?? a.balance,
      reserved: round2(Number(a.balance ?? 0) - Number(a.available ?? a.balance ?? 0)),
    })),
  };
}

async function transactions(limit: number) {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit || 50);
  return { transactions: (data ?? []).map(mapTransaction) };
}

async function cards() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb.from("cards").select("*").eq("user_id", user.id);
  return { cards: (data ?? []).map(mapCard) };
}

async function beneficiaries() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb
    .from("beneficiaries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return {
    beneficiaries: (data ?? []).map((b: BeneficiaryRow) => ({
      id: b.id,
      name: b.name,
      kind: b.kind ?? (b.crypto_currency ? "crypto" : "local"),
      favorite: Boolean(b.favorite),
      bank: b.bank,
      bank_name: b.bank_name ?? b.bank,
      account_number: b.account_number,
      nickname: b.nickname,
      swift: b.swift,
      account_type: b.account_type,
      routing_number: b.routing_number,
      country: b.country,
      bank_address: b.bank_address,
      iban: b.iban,
      crypto_currency: b.crypto_currency,
      used_count: b.used_count ?? 0,
      last_used_at: b.last_used_at,
      created_at: b.created_at,
    })),
  };
}

async function deposits() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb
    .from("deposits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return { deposits: data ?? [] };
}

async function withdrawals() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb
    .from("withdrawals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return { withdrawals: data ?? [] };
}

async function cryptoAssets() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb
    .from("crypto_assets")
    .select("*")
    .eq("user_id", user.id);
  return {
    assets: (data ?? []).map((a) => ({
      symbol: a.symbol,
      name: a.name,
      mock_rate_usd: Number(a.price_usd ?? 0),
      balance: a.balance,
    })),
  };
}

async function notifications() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as NotificationRow[];
  return {
    notifications: rows.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body ?? "",
      link: n.link,
      read_at: n.read_at,
      created_at: n.created_at,
    })),
    unread: rows.filter((n) => !n.read_at).length,
  };
}

async function settings() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return { settings: (data as SettingsRow | null) ?? null };
}

async function loans() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb.from("loans").select("*").eq("user_id", user.id);
  return { loans: data ?? [] };
}

async function grants() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb.from("grants").select("*").eq("user_id", user.id);
  return { grants: data ?? [] };
}

/** Member-facing: only the signed-in member's own tax refund records. */
async function irsRefunds() {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data } = await admin
    .from("irs_refunds")
    .select("id, tax_year, amount, status, notes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return { refunds: data ?? [] };
}

async function getDisabledPaymentMethodIds(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_config")
    .select("value")
    .eq("key", "payment_methods_disabled")
    .maybeSingle();
  const value = (data as { value?: unknown } | null)?.value;
  return Array.isArray(value) ? (value as string[]) : [];
}

async function setAdminConfig(key?: string, value?: Record<string, unknown> | unknown[] | null) {
  const admin = createAdminClient();
  await requireAdmin();
  if (!key || value === undefined) {
    throw new DbError("invalid_request", "Missing config key or value.");
  }
  await admin
    .from("admin_config")
    .upsert({ key, value: value as object, updated_at: new Date().toISOString() });
  await writeAudit({ action: "config.update", target_type: "config", target_id: key, details: { value } });
  return { ok: true };
}

async function getAdminConfig(key?: string) {
  const admin = createAdminClient();
  await requireAdmin();
  if (!key) {
    const { data: all } = await admin.from("admin_config").select("*");
    return { config: all ?? [] };
  }
  const { data } = await admin
    .from("admin_config")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return { value: (data as { value?: unknown } | null)?.value ?? null };
}

/** Admin issues the confirmation code for one specific pending withdrawal. */
async function generateWithdrawalCode(input: { id?: string }) {
  await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing withdrawal id.");
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("withdrawals")
    .select("id, user_id, amount, currency, status, reference, users(email)")
    .eq("id", input.id)
    .limit(1);
  const w = firstRow(rows) as (Record<string, unknown> & {
    status?: string;
    confirmation_code_used_at?: string | null;
    users?: { email?: string };
  }) | null;
  if (!w) throw new DbError("not_found", "Withdrawal not found.", 404);
  if (w.status !== "pending") {
    throw new DbError("invalid_state", "Only pending withdrawals can receive a confirmation code.");
  }
  if (w.confirmation_code_used_at) {
    throw new DbError("code_already_used", "This withdrawal was already confirmed with a code.");
  }

  const code = generateNumericCode();
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + 60 * 60 * 1000); // valid 1 hour
  await admin
    .from("withdrawals")
    .update({
      confirmation_code: code,
      confirmation_code_generated_at: generatedAt.toISOString(),
      confirmation_code_expires_at: expiresAt.toISOString(),
      confirmation_code_used_at: null,
    })
    .eq("id", input.id);

  await writeAudit({
    action: "withdrawal.code_generated",
    target_type: "withdrawal",
    target_id: String(input.id),
    target_label: w.users?.email,
    details: { user_id: w.user_id, amount: w.amount, expires_at: expiresAt.toISOString() },
  });
  return {
    ok: true,
    code,
    generated_at: generatedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  };
}

async function adminTogglePaymentMethod(input: { id?: string; enabled?: boolean }) {
  await requireAdmin();
  if (!input.id || input.enabled === undefined) {
    throw new DbError("invalid_request", "Missing method id or enabled flag.");
  }
  await ensurePaymentMethodsSeeded();
  const admin = createAdminClient();
  const { error } = await admin
    .from("payment_methods")
    .update({ enabled: Boolean(input.enabled), updated_at: new Date().toISOString() })
    .eq("id", input.id);
  if (error) throw new DbError("update_failed", error.message, 500);
  await writeAudit({
    action: "payment_method.update",
    target_type: "payment_method",
    target_id: input.id,
    details: { enabled: Boolean(input.enabled) },
  });
  return { ok: true };
}


async function adminPaymentMethods() {
  await requireAdmin();
  await ensurePaymentMethodsSeeded();
  const admin = createAdminClient();
  const { data } = await admin
    .from("payment_methods")
    .select("*")
    .order("sort_order", { ascending: true });
  return { methods: (data ?? []) as PaymentMethod[] };
}

/** Seed the payment_methods table from the built-in defaults (idempotent). */
async function ensurePaymentMethodsSeeded() {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("payment_methods").select("id").limit(1);
  if (existing && existing.length > 0) return;
  const rows = paymentMethodsList.map((m, i) => ({
    id: m.id,
    name: m.name,
    type: m.type as "deposit" | "withdrawal",
    emoji: m.emoji ?? "",
    minimum: Number(m.minimum ?? 0),
    maximum: Number(m.maximum ?? 0),
    charges_amount: Number(m.charges_amount ?? 0),
    duration: m.duration ?? null,
    custom_fields: m.custom_fields ?? [],
    enabled: true,
    sort_order: i * 10,
  }));
  await admin.from("payment_methods").upsert(rows, { onConflict: "id" });
}

/** Read the live, enabled payment methods for one type from the database. */
async function dbPaymentMethodList(type: "deposit" | "withdrawal"): Promise<PaymentMethod[]> {
  await ensurePaymentMethodsSeeded();
  const admin = createAdminClient();
  const { data } = await admin
    .from("payment_methods")
    .select("*")
    .eq("type", type)
    .eq("enabled", true)
    .order("sort_order", { ascending: true });
  if (!data || data.length === 0) {
    return paymentMethodsList.filter((m) => m.type === type);
  }
  return data as unknown as PaymentMethod[];
}

async function savePaymentMethod(
  input: Partial<PaymentMethod> & { instructions?: string | null },
) {
  await requireAdmin();
  await ensurePaymentMethodsSeeded();
  const admin = createAdminClient();

  const isNew = !input.id;
  let id = input.id;
  if (isNew) {
    const type = input.type === "withdrawal" ? "withdraw" : "deposit";
    const slug =
      (input.name ?? "method").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 28) ||
      "method";
    id = `${type}_${slug}_${Date.now().toString(36).slice(-4)}`;
  }
  if (!input.name?.trim()) throw new DbError("invalid_name", "Method name is required.");

  // Merge with the stored row so a partial save never wipes existing configuration.
  let existing: Record<string, unknown> = {};
  if (!isNew) {
    const { data: prevRows } = await admin.from("payment_methods").select("*").eq("id", id).limit(1);
    existing = (firstRow(prevRows) as Record<string, unknown> | null) ?? {};
  }
  const keep = <T,>(value: T | undefined, key: string, fallback: T): T =>
    value !== undefined && value !== null ? value : ((existing[key] as T) ?? fallback);

  const patch = {
    id: id as string,
    name: input.name.trim(),
    type: (input.type === "withdrawal" ? "withdrawal" : "deposit") as "deposit" | "withdrawal",
    emoji: keep(input.emoji || undefined, "emoji", "💳"),
    minimum: keep(parseAmountInput(input.minimum), "minimum", 0),
    maximum: keep(parseAmountInput(input.maximum), "maximum", 0),
    charges_amount: keep(parseAmountInput(input.charges_amount), "charges_amount", 0),
    charges_type: keep(input.charges_type ?? undefined, "charges_type", null as string | null),
    duration: keep(input.duration ?? undefined, "duration", null as string | null),
    instructions: keep(input.instructions ?? undefined, "instructions", null as string | null),
    custom_fields: keep(input.custom_fields, "custom_fields", [] as NonNullable<PaymentMethod["custom_fields"]>),
    enabled: keep(input.enabled, "enabled", true),
    sort_order: keep(
      typeof input.sort_order === "number" ? input.sort_order : undefined,
      "sort_order",
      500,
    ),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("payment_methods")
    .upsert(patch, { onConflict: "id" })
    .select()
    .single();
  if (error) throw new DbError("save_failed", error.message, 500);
  await writeAudit({
    action: isNew ? "payment_method.create" : "payment_method.update",
    target_type: "payment_method",
    target_id: patch.id,
    target_label: patch.name,
    details: { name: patch.name, type: patch.type, enabled: patch.enabled },
  });
  return { method: data };
}

async function deletePaymentMethod(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing method id.");
  const admin = createAdminClient();
  const { error } = await admin.from("payment_methods").delete().eq("id", id);
  if (error) throw new DbError("delete_failed", error.message, 500);
  await writeAudit({ action: "payment_method.delete", target_type: "payment_method", target_id: id });
  return { ok: true };
}

async function paymentMethods(forType: string) {
  const user = await requireUser();
  const type: "deposit" | "withdrawal" = forType === "withdrawal" ? "withdrawal" : "deposit";
  const methods = await dbPaymentMethodList(type);
  // Admins can hide bank details per member; crypto methods always stay visible.
  if (!user.mask_payment_details) return { methods };
  return {
    methods: methods.map((m) => (isCryptoMethod(m) ? m : maskPaymentMethodDetails(m))),
  };
}

async function transferConfig() {
  await requireUser();
  return transferConfigDefaults();
}

async function getKyc() {
  const user = await requireUser();
  // Admin client: settings has no INSERT policy for users, only server-side
  // enforcement via requireUser.
  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("security").eq("user_id", user.id).maybeSingle();
  const security = (data as { security?: Record<string, unknown> } | null)?.security ?? {};
  const kyc = security.kyc;
  return { kyc: (kyc && typeof kyc === "object" ? kyc : {}) as Record<string, unknown> };
}

async function supportTickets() {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data } = await admin
    .from("support_tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as SupportTicketRow[];
  const ids = rows.map((t) => t.id);
  let messages: (SupportMessageRow & { read_at?: string | null })[] = [];
  if (ids.length > 0) {
    const res = await admin.from("support_messages").select("*").in("ticket_id", ids);
    messages = (res.data ?? []) as (SupportMessageRow & { read_at?: string | null })[];
  }
  return {
    tickets: rows.map((t) => {
      const mine = messages
        .filter((m) => m.ticket_id === t.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      const last = mine[0];
      const unread = mine.filter((m) => m.sender === "support" && !m.read_at).length;
      return {
        id: t.id,
        subject: t.subject,
        category: t.category,
        status: t.status,
        last_message: last?.body ?? null,
        last_message_at: last?.created_at ?? t.created_at,
        unread_for_user: unread,
      };
    }),
  };
}

async function supportTicket(id: string) {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .limit(1);
  const ticket = firstRow(rows) as SupportTicketRow | null;
  if (!ticket) throw new DbError("not_found", "Ticket not found.", 404);
  // Reading the thread marks support replies as seen.
  await admin
    .from("support_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("ticket_id", id)
    .eq("sender", "support")
    .is("read_at", null);
  const { data: msgRows } = await admin
    .from("support_messages")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });
  return {
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      last_message_at: ticket.created_at,
      unread_for_user: 0,
    },
    messages: ((msgRows ?? []) as SupportMessageRow[]).map((m) => ({
      id: m.id,
      body: m.body,
      from: m.sender,
      sender: m.sender === "support" ? "admin" : "user",
      created_at: m.created_at,
    })),
  };
}

async function requireUser(): Promise<UserRow> {
  const user = await currentUser();
  if (!user) throw new DbError("unauthenticated", "Not signed in.", 401);
  return user;
}

/* ------------------------------------------------------------------------- */
/* Mutations                                                                 */
/* ------------------------------------------------------------------------- */

async function createTransfer(input: {
  amount: number;
  currency?: string;
  beneficiary_id?: string;
  name?: string;
  account_number?: string;
  note?: string;
  recipient_email?: string;
  pin?: string;
  narration?: string;
}): Promise<
  | { fee: number; ref: string; transfer_id: string }
  | { transaction: ReturnType<typeof mapTransaction> | null }
> {
  const user = await requireUser();
  if (!input.amount || input.amount <= 0) {
    throw new DbError("invalid_amount", "Enter a valid amount.");
  }

  if (input.recipient_email) {
    return memberTransfer(user, {
      amount: input.amount,
      currency: input.currency,
      recipient_email: input.recipient_email,
      pin: input.pin,
      narration: input.narration,
    });
  }

  const sb = await createServerClient();
  const admin = createAdminClient();

  // A transfer starts as PENDING and only reserves the money: `available`
  // drops so it can't be spent twice, while `balance` moves only once the
  // transfer is completed (admin approval / confirmation).
  const { error: holdError } = await admin.rpc("hold_funds", {
    p_user_id: user.id,
    p_amount: input.amount,
    p_currency: input.currency ?? "USD",
  });
  if (holdError) {
    const msg = holdError.message;
    throw new DbError(
      msg.includes("insufficient_funds") ? "insufficient_funds" : "transfer_failed",
      msg.includes("insufficient_funds")
        ? "Insufficient funds for this transfer."
        : "The transfer could not be completed.",
      400,
    );
  }

  const { data: account } = await sb
    .from("accounts")
    .select("id, balance")
    .eq("user_id", user.id)
    .eq("currency", input.currency ?? "USD")
    .single();

  let beneficiaryName = input.name;
  if (input.beneficiary_id) {
    const { data: b } = await sb
      .from("beneficiaries")
      .select("name")
      .eq("id", input.beneficiary_id)
      .maybeSingle();
    beneficiaryName = (b as { name?: string } | null)?.name ?? beneficiaryName;
  }

  const { data: tx } = await admin
    .from("transactions")
    .insert({
      user_id: user.id,
      account_id: account?.id ?? null,
      kind: "transfer",
      direction: "debit",
      amount: input.amount,
      currency: input.currency ?? "USD",
      name: beneficiaryName ?? input.name ?? "Transfer sent",
      reference: input.note ?? null,
      status: "pending",
      balance_after: null,
    })
    .select()
    .single();

  return { transaction: tx ? mapTransaction(tx as TransactionRow) : null };
}


async function memberTransfer(
  user: UserRow,
  input: {
    amount: number;
    currency?: string;
    recipient_email: string;
    pin?: string;
    narration?: string;
  },
): Promise<{ fee: number; ref: string; transfer_id: string }> {
  const cfg = transferConfigDefaults();
  if (input.amount < cfg.min_transfer) {
    throw new DbError("below_minimum", `Minimum transfer is ${cfg.min_transfer}.`, 400, {
      min_transfer: cfg.min_transfer,
    });
  }
  if (input.amount > cfg.max_transfer) {
    throw new DbError("above_maximum", `Maximum transfer is ${cfg.max_transfer}.`, 400, {
      max_transfer: cfg.max_transfer,
    });
  }
  await checkPin(user, input.pin);

  const email = input.recipient_email.trim().toLowerCase();
  if (email === user.email) {
    throw new DbError("cannot_transfer_to_self", "You can't transfer to yourself.");
  }
  const admin = createAdminClient();
  const { data: recipientRow } = await admin
    .from("users")
    .select("id, email, first_name, last_name, full_name")
    .eq("email", email)
    .maybeSingle();
  const recipient = recipientRow as Pick<UserRow, "id" | "email" | "first_name" | "last_name" | "full_name"> | null;
  if (!recipient) {
    throw new DbError("recipient_not_found", "No member found with that email.");
  }

  await createServerClient();

  const fee = round2(input.amount * (cfg.transfer_charges / 100));
  const total = round2(input.amount + fee);

  // A pending transfer only RESERVES the money (available drops, balance is
  // untouched). It is settled when the confirmation code is verified and
  // released if it is rejected/cancelled.
  const { error: holdError } = await admin.rpc("hold_funds", {
    p_user_id: user.id,
    p_amount: total,
    p_currency: input.currency ?? "USD",
  });
  if (holdError) {
    throw new DbError("insufficient_funds", "Insufficient funds for this transfer.");
  }

  // The recipient is credited only once the transfer is confirmed
  // (see verifyTransfer) — never at request time.


  const ref = `TFR-${Date.now().toString(36).toUpperCase()}`;
  // Member transfers also wait for the confirmation code. The recipient is
  // credited only after the code is verified (see verifyTransfer).
  const transferCode = generateNumericCode();
  const codeGeneratedAt = new Date();
  const codeExpiresAt = new Date(codeGeneratedAt.getTime() + 60 * 60 * 1000);
  const { data: memTx, error: memTxError } = await admin
    .from("transactions")
    .insert([
      {
        user_id: user.id,
        kind: "transfer",
        direction: "debit",
        amount: input.amount,
        currency: input.currency ?? "USD",
        name: recipient.full_name ?? `${recipient.first_name} ${recipient.last_name}`.trim(),
        reference: ref,
        status: "pending",
        fee,
        confirmation_code: transferCode,
        confirmation_code_generated_at: codeGeneratedAt.toISOString(),
        confirmation_code_expires_at: codeExpiresAt.toISOString(),
      },
      {
        user_id: recipient.id,
        kind: "transfer",
        direction: "credit",
        amount: input.amount,
        currency: input.currency ?? "USD",
        name: `${user.full_name} (${user.email})`,
        reference: ref,
        status: "pending",
        fee: 0,
      },
    ])
    .select("id, direction");
  if (memTxError || !memTx) {
    throw new DbError("transfer_failed", "The transfer could not be recorded.", 500);
  }
  const senderRow = (memTx as { id: string; direction: string }[]).find(
    (row) => row.direction === "debit",
  );
  const transferId = String(senderRow?.id ?? "");

  return { fee, ref, transfer_id: transferId };
}

async function createDeposit(input: { amount: number; method: string; currency?: string }) {
  const user = await requireUser();
  const sb = await createServerClient();
  const admin = createAdminClient();

  if (!input.amount || input.amount <= 0) {
    throw new DbError("invalid_amount", "Enter a valid amount.");
  }

  const { data: deposit } = await sb
    .from("deposits")
    .insert({
      user_id: user.id,
      method: input.method,
      amount: input.amount,
      currency: input.currency ?? "USD",
      status: "pending",
    })
    .select()
    .single();

  // Deposits require admin verification before the balance is credited.
  await admin.from("notifications").insert({
    user_id: user.id,
    title: "Deposit received",
    body: `Your deposit of ${(input.currency ?? "USD")} ${input.amount.toLocaleString()} is pending verification.`,
    link: "/deposits",
  });

  return { deposit };
}

async function createWithdrawal(input: {
  amount: number;
  method: string;
  account_number?: string;
  currency?: string;
}) {
  const user = await requireUser();
  const sb = await createServerClient();
  const admin = createAdminClient();

  if (!input.amount || input.amount <= 0) {
    throw new DbError("invalid_amount", "Enter a valid amount.");
  }

  // Pending withdrawals only RESERVE the money: `available` drops so it can't
  // be spent twice, but the balance is not reduced until the withdrawal is
  // actually completed (admin approval / confirmation code).
  const { error: holdError } = await admin.rpc("hold_funds", {
    p_user_id: user.id,
    p_amount: input.amount,
    p_currency: input.currency ?? "USD",
  });
  if (holdError) {
    throw new DbError(
      holdError.message.includes("insufficient_funds")
        ? "insufficient_funds"
        : "withdrawal_failed",
      holdError.message.includes("insufficient_funds")
        ? "Insufficient funds for this withdrawal."
        : "The withdrawal could not be completed.",
      400,
    );
  }

  const { data: withdrawal } = await sb
    .from("withdrawals")
    .insert({
      user_id: user.id,
      method: input.method,
      amount: input.amount,
      currency: input.currency ?? "USD",
      account_number: input.account_number ?? null,
      status: "pending",
    })
    .select()
    .single();

  const wRow = withdrawal as WithdrawalRow | null;
  await admin.from("transactions").insert({
    user_id: user.id,
    kind: "withdrawal",
    direction: "debit",
    amount: input.amount,
    currency: input.currency ?? "USD",
    name: "Withdrawal",
    // Tie the history row to THIS withdrawal so status updates can never hit
    // another pending withdrawal of the same user.
    reference: wRow?.id ?? null,
    status: "pending",
  });


  return { withdrawal };
}

async function createBeneficiary(input: {
  name: string;
  kind?: string;
  favorite?: boolean;
  account_number?: string;
  bank_name?: string;
  swift?: string;
  account_type?: string;
  routing_number?: string;
  country?: string;
  bank_address?: string;
  iban?: string;
  crypto_currency?: string;
  bank?: string;
}) {
  const user = await requireUser();
  const sb = await createServerClient();
  if (!input.name) throw new DbError("invalid_name", "Beneficiary name is required.");
  const { data } = await sb
    .from("beneficiaries")
    .insert({
      user_id: user.id,
      name: input.name,
      kind: input.kind ?? (input.crypto_currency ? "crypto" : "local"),
      favorite: input.favorite ?? false,
      account_number: input.account_number ?? null,
      bank: input.bank_name ?? input.bank ?? null,
      bank_name: input.bank_name ?? null,
      swift: input.swift ?? null,
      account_type: input.account_type ?? null,
      routing_number: input.routing_number ?? null,
      country: input.country ?? null,
      bank_address: input.bank_address ?? null,
      iban: input.iban ?? null,
      crypto_currency: input.crypto_currency ?? null,
      used_count: 0,
    })
    .select()
    .single();
  return { beneficiary: data };
}

async function updateBeneficiary(id: string, patch: Partial<BeneficiaryRow>) {
  const user = await requireUser();
  const sb = await createServerClient();
  const clean = { ...patch };
  if (clean.bank_name != null) clean.bank = clean.bank_name;
  if (clean.routing_number != null) clean.routing = clean.routing_number;
  await sb.from("beneficiaries").update(clean).eq("id", id).eq("user_id", user.id);
  return { ok: true };
}

async function deleteBeneficiary(id: string) {
  const user = await requireUser();
  const sb = await createServerClient();
  await sb.from("beneficiaries").delete().eq("id", id).eq("user_id", user.id);
  return { ok: true };
}

/**
 * Withdrawal money-hold helpers.
 *
 * A pending withdrawal reserves the amount (available drops, balance stays).
 * Exactly one of these two can ever run for a given withdrawal — the
 * timestamp columns make both operations idempotent, so a double approval or
 * a reject-after-approve can never move the money twice.
 */
type HoldWithdrawal = WithdrawalRow & {
  hold_settled_at?: string | null;
  hold_released_at?: string | null;
};

async function settleWithdrawalHold(w: HoldWithdrawal) {
  const admin = createAdminClient();
  const { data: claimed } = await admin
    .from("withdrawals")
    .update({ hold_settled_at: new Date().toISOString() })
    .eq("id", w.id)
    .is("hold_settled_at", null)
    .is("hold_released_at", null)
    .select("id");
  if (!claimed || claimed.length === 0) return false;
  await admin.rpc("settle_hold", {
    p_user_id: w.user_id,
    p_amount: Number(w.amount),
    p_currency: w.currency,
  });
  return true;
}

async function releaseWithdrawalHold(w: HoldWithdrawal) {
  const admin = createAdminClient();
  const { data: claimed } = await admin
    .from("withdrawals")
    .update({ hold_released_at: new Date().toISOString() })
    .eq("id", w.id)
    .is("hold_settled_at", null)
    .is("hold_released_at", null)
    .select("id");
  if (!claimed || claimed.length === 0) return false;
  await admin.rpc("release_hold", {
    p_user_id: w.user_id,
    p_amount: Number(w.amount),
    p_currency: w.currency,
  });
  return true;
}


async function requestWithdrawal(input: {
  amount: number;
  method_id?: string | number;
  custom?: Record<string, string>;
  destination?: Record<string, unknown> | string;
  pin?: string;
}) {
  const user = await requireUser();
  if (!input.amount || input.amount <= 0) {
    throw new DbError("invalid_amount", "Enter a valid amount.");
  }
  const methods = await dbPaymentMethodList("withdrawal");
  const method =
    input.method_id != null
      ? methods.find((m) => m.id === String(input.method_id))
      : undefined;
  if (method) {
    const min = Number(method.minimum ?? 0);
    if (min > 0 && input.amount < min) {
      throw new DbError("below_minimum", `Minimum withdrawal is ${min}.`, 400, { min_transfer: min });
    }
    const max = Number(method.maximum ?? 0);
    if (max > 0 && input.amount > max) {
      throw new DbError("above_maximum", `Maximum withdrawal is ${max}.`, 400, { max_transfer: max });
    }
  }
  await checkPin(user, input.pin);

  const sb = await createServerClient();
  const admin = createAdminClient();
  // Reserve (hold) the money — the balance itself only changes on completion.
  const { error: holdError } = await admin.rpc("hold_funds", {
    p_user_id: user.id,
    p_amount: input.amount,
    p_currency: "USD",
  });
  if (holdError) {
    throw new DbError("insufficient_balance", "Not enough balance for this withdrawal.");
  }
  const { data: withdrawal } = await sb
    .from("withdrawals")
    .insert({
      user_id: user.id,
      method: method?.name ?? "bank_transfer",
      amount: input.amount,
      currency: "USD",
      status: "pending",
    })
    .select()
    .single();
  const row = withdrawal as WithdrawalRow;
  await admin.from("transactions").insert({
    user_id: user.id,
    kind: "withdrawal",
    direction: "debit",
    amount: input.amount,
    currency: "USD",
    name: "Withdrawal",
    reference: row?.id ?? null,
    status: "pending",
    fee: "0.00",
  });

  await admin.from("notifications").insert({
    user_id: user.id,
    title: "Withdrawal submitted",
    body: `A withdrawal of $${input.amount.toLocaleString()} is pending review.`,
    link: "/withdraw",
  });
  return { withdrawal_id: row?.id ?? `w-${Date.now()}` };
}

async function verifyWithdrawal(input: { withdrawal_id: string; code: string }) {
  const user = await requireUser();
  const supplied = String(input.code ?? "").trim();
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("withdrawals")
    .select("*")
    .eq("id", input.withdrawal_id)
    .eq("user_id", user.id)
    .limit(1);
  const w = firstRow(rows) as (WithdrawalRow & {
    confirmation_code?: string | null;
    confirmation_code_expires_at?: string | null;
    confirmation_code_used_at?: string | null;
  }) | null;

  // The code must belong to THIS withdrawal, be unused, unexpired and the
  // withdrawal itself must still be awaiting completion.
  const valid =
    w &&
    w.confirmation_code &&
    supplied.length > 0 &&
    supplied === w.confirmation_code &&
    !w.confirmation_code_used_at &&
    w.confirmation_code_expires_at &&
    new Date(w.confirmation_code_expires_at).getTime() > Date.now() &&
    w.status === "pending";

  if (!valid) {
    throw new DbError("invalid_code", "That code is wrong, expired or already used.");
  }

  const now = new Date().toISOString();
  await admin
    .from("withdrawals")
    .update({
      // NOTE: the withdrawals table has no otp_verified_at column; using it
      // would make the whole UPDATE fail silently.
      confirmation_code_used_at: now,
      status: "completed",
    })
    .eq("id", w.id);

  // Now — and only now — the reserved money actually leaves the balance.
  await settleWithdrawalHold(w);

  await admin
    .from("transactions")
    .update({ status: "completed" })
    .eq("user_id", user.id)
    .eq("kind", "withdrawal")
    .eq("reference", w.id)
    .eq("status", "pending");


  await admin.from("notifications").insert({
    user_id: user.id,
    title: "Withdrawal completed",
    body: `Your withdrawal of ${w.currency} ${Number(w.amount).toLocaleString()} has been completed.`,
    link: "/transactions",
  });
  return { ok: true };
}

async function createExternalTransfer(input: {
  scope?: string;
  method?: string;
  beneficiary_name?: string;
  account_number?: string;
  bank_name?: string;
  account_type?: string;
  swift?: string;
  routing?: string;
  amount: number;
  narration?: string;
  pin?: string;
  save_beneficiary?: boolean;
  beneficiary_id?: string;
}) {
  const user = await requireUser();
  if (!input.amount || input.amount <= 0) {
    throw new DbError("invalid_amount", "Enter a valid amount.");
  }
  const cfg = transferConfigDefaults();
  if (input.amount < cfg.min_transfer) {
    throw new DbError("below_minimum", `Minimum transfer is ${cfg.min_transfer}.`, 400, {
      min_transfer: cfg.min_transfer,
    });
  }
  if (input.amount > cfg.max_transfer) {
    throw new DbError("above_maximum", `Maximum transfer is ${cfg.max_transfer}.`, 400, {
      max_transfer: cfg.max_transfer,
    });
  }
  await checkPin(user, input.pin);

  const fee = round2(input.amount * (cfg.transfer_charges / 100));
  const total = round2(input.amount + fee);
  const sb = await createServerClient();
  const admin = createAdminClient();
  // Reserve the amount + fee while the transfer waits for its confirmation
  // code; the balance only moves once the code is verified.
  const { error: holdError } = await admin.rpc("hold_funds", {
    p_user_id: user.id,
    p_amount: total,
    p_currency: "USD",
  });
  if (holdError) {
    throw new DbError("insufficient_funds", "Insufficient funds for this transfer.");
  }


  const ref = `TFR-${Date.now().toString(36).toUpperCase()}`;
  // A unique confirmation code is issued immediately and stored on the
  // transaction so it is available to admins right away.
  const transferCode = generateNumericCode();
  const codeGeneratedAt = new Date();
  const codeExpiresAt = new Date(codeGeneratedAt.getTime() + 60 * 60 * 1000);
  const { data: extTx, error: extTxError } = await admin
    .from("transactions")
    .insert({
      user_id: user.id,
      kind: "transfer",
      direction: "debit",
      amount: input.amount,
      currency: "USD",
      name: input.beneficiary_name ?? "Transfer sent",
      reference: ref,
      status: "pending",
      fee,
      confirmation_code: transferCode,
      confirmation_code_generated_at: codeGeneratedAt.toISOString(),
      confirmation_code_expires_at: codeExpiresAt.toISOString(),
    })
    .select("id")
    .single();
  if (extTxError || !extTx) {
    throw new DbError("transfer_failed", "The transfer could not be recorded.", 500);
  }
  const transferId = String((extTx as { id: string }).id);

  if (input.save_beneficiary && input.account_number) {
    const { data: existing } = await sb
      .from("beneficiaries")
      .select("id")
      .eq("user_id", user.id)
      .eq("account_number", input.account_number)
      .maybeSingle();
    if (existing) {
      await sb.from("beneficiaries").update({ name: input.beneficiary_name }).eq("id", existing.id);
    } else {
      await sb.from("beneficiaries").insert({
        user_id: user.id,
        name: input.beneficiary_name ?? "Beneficiary",
        kind: input.scope === "international" ? "international" : "local",
        account_number: input.account_number,
        bank: input.bank_name ?? null,
        bank_name: input.bank_name ?? null,
        swift: input.swift ?? null,
        account_type: input.account_type ?? null,
        routing_number: input.routing ?? null,
        used_count: 0,
      });
    }
  }
  return { fee, ref, transfer_id: transferId };
}

async function verifyTransfer(input: { transfer_id: string; code: string }) {
  const user = await requireUser();
  const supplied = String(input.code ?? "").trim();
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("transactions")
    .select("*")
    .eq("id", String(input.transfer_id ?? ""))
    .eq("user_id", user.id)
    .eq("kind", "transfer")
    .eq("status", "pending")
    .limit(1);
  const w = firstRow(rows) as (TransactionRow & {
    confirmation_code?: string | null;
    confirmation_code_expires_at?: string | null;
    confirmation_code_used_at?: string | null;
  }) | null;

  // The code must belong to THIS transfer, be unused, unexpired and the
  // transfer itself must still be pending.
  const valid =
    w &&
    w.confirmation_code &&
    supplied.length > 0 &&
    supplied === w.confirmation_code &&
    !w.confirmation_code_used_at &&
    w.confirmation_code_expires_at &&
    new Date(w.confirmation_code_expires_at).getTime() > Date.now();

  if (!valid) {
    throw new DbError("invalid_code", "That code is wrong, expired or already used.");
  }

  const now = new Date().toISOString();
  // Claim the sender row (status + hold flag) before touching any balance, so
  // the same transfer can never be settled twice.
  const { data: claimedSender } = await admin
    .from("transactions")
    .update({ status: "completed", confirmation_code_used_at: now, hold_settled_at: now })
    .eq("id", w.id)
    .eq("status", "pending")
    .is("hold_settled_at", null)
    .select("id");
  if (!claimedSender || claimedSender.length === 0) {
    throw new DbError("already_processed", "This transfer was already completed.");
  }
  // The reserved amount (transfer + fee) now leaves the sender's balance.
  await admin.rpc("settle_hold", {
    p_user_id: w.user_id,
    p_amount: round2(Number(w.amount) + Number(w.fee ?? 0)),
    p_currency: w.currency,
  });


  // Member-to-member transfers carry a pending credit row for the recipient
  // under the same reference — settle it now that the code is verified.
  const { data: counterparts } = await admin
    .from("transactions")
    .select("id, user_id, amount, currency")
    .eq("reference", w.reference)
    .eq("kind", "transfer")
    .eq("direction", "credit")
    .eq("status", "pending")
    .neq("id", w.id)
    .limit(1);
  const counter = firstRow(counterparts) as { id: string; user_id: string; amount: string | number; currency: string } | null;
  if (counter) {
    // Claim the pending credit row first, so the recipient can never be
    // credited twice if this runs concurrently.
    const { data: claimedCredit } = await admin
      .from("transactions")
      .update({ status: "completed" })
      .eq("id", counter.id)
      .eq("status", "pending")
      .select("id");
    if (claimedCredit && claimedCredit.length > 0) {
      await admin.rpc("credit_account", {
        p_user_id: counter.user_id,
        p_amount: Number(counter.amount),
        p_currency: counter.currency,
      });
    }

    await admin.from("notifications").insert({
      user_id: counter.user_id,
      title: "Transfer received",
      body: `${user.full_name} sent you ${counter.currency === "USD" ? "$" : `${counter.currency} `}${Number(counter.amount).toLocaleString()}.`,
      link: "/transactions",
    });
  }

  await admin.from("notifications").insert({
    user_id: user.id,
    title: "Transfer completed",
    body: `Your transfer of ${w.currency} ${Number(w.amount).toLocaleString()} has been completed.`,
    link: "/transactions",
  });

  const { data: account } = await admin
    .from("accounts")
    .select("balance")
    .eq("user_id", user.id)
    .eq("currency", w.currency)
    .single();
  return {
    ok: true,
    balance_after: account ? Number((account as { balance: number }).balance) : 0,
  };
}

/** Permanently remove one transaction record (admin only). */
async function adminDeleteTransaction(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing transaction id.");
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("transactions")
    .select("id, user_id, kind, amount, currency, users(email)")
    .eq("id", id)
    .limit(1);
  const row = firstRow(rows) as (Record<string, unknown> & { users?: { email?: string } }) | null;
  if (!row) throw new DbError("not_found", "Transaction not found.", 404);

  const { error } = await admin.from("transactions").delete().eq("id", id);
  if (error) throw new DbError("delete_failed", error.message, 500);

  await writeAudit({
    action: "transaction.delete",
    target_type: "transaction",
    target_id: String(id),
    target_label: row.users?.email,
    details: {
      owner_user_id: row.user_id,
      kind: row.kind,
      amount: row.amount,
      currency: row.currency,
    },
  });
  return { ok: true };
}

/** Admin re-issues the confirmation code for a pending transfer. */
async function generateTransferCode(input: { id?: string }) {
  await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing transfer id.");
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("transactions")
    .select("id, user_id, amount, currency, reference, status, users(email)")
    .eq("id", input.id)
    .eq("kind", "transfer")
    .limit(1);
  const t = firstRow(rows) as (Record<string, unknown> & {
    status?: string;
    confirmation_code_used_at?: string | null;
    users?: { email?: string };
  }) | null;
  if (!t) throw new DbError("not_found", "Transfer not found.", 404);
  if (t.status !== "pending") {
    throw new DbError("invalid_state", "Only pending transfers can receive a confirmation code.");
  }
  if (t.confirmation_code_used_at) {
    throw new DbError("code_already_used", "This transfer was already confirmed with a code.");
  }
  const code = generateNumericCode();
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + 60 * 60 * 1000);
  await admin
    .from("transactions")
    .update({
      confirmation_code: code,
      confirmation_code_generated_at: generatedAt.toISOString(),
      confirmation_code_expires_at: expiresAt.toISOString(),
      confirmation_code_used_at: null,
    })
    .eq("id", input.id);
  await writeAudit({
    action: "transfer.code_generated",
    target_type: "transaction",
    target_id: String(input.id),
    target_label: t.users?.email,
    details: { amount: t.amount, expires_at: expiresAt.toISOString() },
  });
  return { ok: true, code, generated_at: generatedAt.toISOString(), expires_at: expiresAt.toISOString() };
}

async function uploadFile(input: { filename?: string; contentType?: string; data?: string }) {
  const user = await requireUser();
  if (!input.data) throw new DbError("invalid_file", "No file content was provided.");
  const raw = input.data.includes(",") ? input.data.split(",")[1] : input.data;
  const body = new Uint8Array(Buffer.from(raw, "base64"));
  const { filename, contentType } = validateUpload(input, body);
  const admin = createAdminClient();
  const path = `${user.id}/${Date.now()}-${filename}`;
  const { error } = await admin.storage
    .from("uploads")
    .upload(path, body, { contentType, upsert: false });
  if (error) throw new DbError("upload_failed", error.message, 500);
  // The uploads bucket is private, so a plain public URL would 403 (broken image).
  // Issue a long-lived signed URL instead.
  const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
  const signed = await admin.storage.from("uploads").createSignedUrl(path, TEN_YEARS);
  const url = signed.data?.signedUrl;
  if (!url) {
    throw new DbError("upload_failed", signed.error?.message ?? "Could not create file URL.", 500);
  }
  return { url, publicUrl: url, path };
}

async function submitContact(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) {
  if (!input.name?.trim() || !input.email?.trim() || !input.message?.trim()) {
    throw new DbError("invalid_input", "Name, email and message are required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    throw new DbError("invalid_email", "Enter a valid email address.");
  }
  await createAdminClient().from("contact_messages").insert({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    subject: input.subject?.trim() || null,
    message: input.message.trim(),
  });
  return { ok: true };
}

async function createSupportTicket(input: { category: string; subject: string; message: string }) {
  const user = await requireUser();
  if (!input.subject || !input.message) {
    throw new DbError("invalid_input", "Subject and message are required.");
  }
  const admin = createAdminClient();
  const id = `t-${Date.now()}`;
  const created = new Date().toISOString();
  const { error } = await admin.from("support_tickets").insert({
    id,
    user_id: user.id,
    subject: input.subject,
    category: input.category ?? "general",
    status: "open",
    created_at: created,
  });
  if (error) throw new DbError("ticket_failed", error.message, 500);
  await admin.from("support_messages").insert({
    ticket_id: id,
    sender: "user",
    body: input.message,
    created_at: created,
  });
  return { id };
}

async function createSupportMessage(id: string, body: string) {
  const user = await requireUser();
  if (!body || !body.trim()) {
    throw new DbError("invalid_input", "Message body is required.");
  }
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("support_tickets")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .limit(1);
  if (!firstRow(rows)) throw new DbError("not_found", "Ticket not found.", 404);
  const trimmed = body.trim();
  await admin.from("support_messages").insert({
    ticket_id: id,
    sender: "user",
    body: trimmed,
  });
  return { body: trimmed };
}

async function transactionsEmail() {
  const user = await requireUser();
  return { ok: true, email: user.email };
}

async function markAllNotificationsRead() {
  return markNotificationsRead();
}

async function markNotificationRead(id: string) {
  const user = await requireUser();
  const sb = await createServerClient();
  await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  return { ok: true };
}

async function deleteNotifications() {
  const user = await requireUser();
  const sb = await createServerClient();
  await sb.from("notifications").delete().eq("user_id", user.id);
  return { ok: true };
}

async function deleteNotification(id: string) {
  const user = await requireUser();
  const sb = await createServerClient();
  await sb.from("notifications").delete().eq("id", id).eq("user_id", user.id);
  return { ok: true };
}

async function markNotificationsRead(ids?: string[]) {
  const user = await requireUser();
  const sb = await createServerClient();
  let query = sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (ids && ids.length) query = query.in("id", ids);
  await query;
  return { ok: true };
}

async function updateSettings(patch: Partial<Pick<SettingsRow, "language" | "currency" | "notifications" | "security">>) {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb
    .from("settings")
    .upsert({ user_id: user.id, ...patch })
    .select()
    .single();
  return { settings: data };
}

async function updateProfile(patch: Partial<Pick<UserRow, "first_name" | "last_name" | "phone" | "photo_url" | "country">>) {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb
    .from("users")
    .update(patch)
    .eq("id", user.id)
    .select()
    .single();
  return { user: mapUser(data as UserRow) };
}

async function submitKyc(patch: KycRecord) {
  const user = await requireUser();
  // Admin client: settings has no INSERT policy for users; access is enforced
  // server-side by requireUser.
  const admin = createAdminClient();
  await admin.from("users").update({ kyc_status: "in_review" }).eq("id", user.id);
  const { error } = await admin.from("settings").upsert({
    user_id: user.id,
    security: { kyc: patch },
  });
  if (error) throw new DbError("kyc_failed", error.message, 500);
  return { ok: true };
}

async function setPin(input: { current_password?: string; pin: string }) {
  const user = await requireUser();
  const sb = await createServerClient();
  if (!/^\d{4,6}$/.test(input.pin)) {
    throw new DbError("invalid_pin", "PIN must be 4 to 6 digits.");
  }
  if (!input.current_password) {
    throw new DbError("invalid_password", "Your account password is incorrect.");
  }
  const anon = createAnonClient(
    supabaseUrl(),
    supabaseAnonKey(),
    { auth: { persistSession: false } },
  );
  const { error: signInError } = await anon.auth.signInWithPassword({
    email: user.email,
    password: input.current_password,
  });
  if (signInError) throw new DbError("invalid_password", "Your account password is incorrect.");
  const { hash } = await hashPassword(input.pin);
  await sb.from("users").update({ pin_hash: hash, pin_gate: false }).eq("id", user.id);
  return { ok: true };
}

async function verifyPin(pin: string) {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb.from("users").select("pin_hash").eq("id", user.id).single();
  const hash = (data as { pin_hash?: string | null }).pin_hash;
  if (!hash || !(await verifyPassword(pin, hash))) {
    throw new DbError("invalid_pin", "Incorrect PIN.");
  }
  await sb.from("users").update({ pin_gate: false }).eq("id", user.id);
  return { ok: true };
}

async function applyCard(input: {
  card_brand?: string;
  currency?: string;
  card_level?: string;
  daily_limit?: number;
  billing_address?: string;
  billing_city?: string;
  billing_zip?: string;
}) {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data, error } = await sb
    .from("card_applications")
    .insert({
      user_id: user.id,
      card_type: input.card_level ?? "credit",
      card_brand: input.card_brand ?? "visa",
      currency: input.currency ?? "USD",
      card_level: input.card_level ?? "standard",
      daily_limit: input.daily_limit ?? null,
      billing_address: input.billing_address ?? null,
      billing_city: input.billing_city ?? null,
      billing_zip: input.billing_zip ?? null,
    })
    .select()
    .single();
  if (error) throw new DbError("application_failed", error.message, 500);
  return { application: data };
}

async function applyLoan(input: { amount: number; interest_rate?: number; term_months?: number }) {
  const user = await requireUser();
  const sb = await createServerClient();
  if (!input.amount || input.amount <= 0) throw new DbError("invalid_amount", "Enter a valid amount.");
  const { data } = await sb
    .from("loans")
    .insert({
      user_id: user.id,
      amount: input.amount,
      interest_rate: input.interest_rate ?? 0,
      term_months: input.term_months ?? null,
      status: "pending",
    })
    .select()
    .single();
  return { loan: data };
}

async function applyGrant(input: { program: string; amount?: number }) {
  const user = await requireUser();
  const sb = await createServerClient();
  if (!input.program) throw new DbError("invalid_program", "Program is required.");
  const { data } = await sb
    .from("grants")
    .insert({ user_id: user.id, program: input.program, amount: input.amount ?? null })
    .select()
    .single();
  return { grant: data };
}

/* ------------------------------------------------------------------------- */
/* Auth                                                                      */
/* ------------------------------------------------------------------------- */

async function loginMethod(slug?: string) {
  await resolveSite(slug);
  // Master auth codes have been retired: admins sign in with email + password.
  return { method: "email_password" };
}

async function register(input: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  pin?: string;
  ref_code?: string;
}) {
  const admin = createAdminClient();

  const email = input.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new DbError("invalid_email", "Enter a valid email address.");
  }
  if (!input.password || input.password.length < 8) {
    throw new DbError("weak_password", "Password must be at least 8 characters.");
  }
  if (!input.first_name.trim() || !input.last_name.trim()) {
    throw new DbError("invalid_name", "Enter your first and last name.");
  }
  if (input.pin && !/^\d{4,6}$/.test(input.pin)) {
    throw new DbError("invalid_pin", "PIN must be 4 to 6 digits.");
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: false,
    user_metadata: {
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      phone: input.phone ?? null,
      account_number: generateAccountNumber(),
    },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      throw new DbError("email_exists", "An account with that email already exists.", 409);
    }
    throw new DbError("registration_failed", error.message, 500);
  }

  if (data.user?.id && input.pin) {
    const { hash } = await hashPassword(input.pin);
    await admin.from("users").update({ pin_hash: hash }).eq("id", data.user.id);
  }
  if (data.user?.id && input.ref_code?.trim()) {
    await admin
      .from("users")
      .update({ referral_code: input.ref_code.trim() })
      .eq("id", data.user.id);
  }

  // Email verification: issue a code and deliver it via SMTP.
  let needs_email_verification = false;
  let dev_code: string | undefined;
  if (data.user?.id) {
    const code = generateNumericCode();
    await admin.from("email_verifications").insert({
      user_id: data.user.id,
      email,
      code_hash: (await hashPassword(code)).hash,
      expires_at: new Date(Date.now() + VERIFY_CODE_TTL_MS).toISOString(),
    });
    const sent = await deliver(email, verificationCodeEmail(code, await siteNameForEmail()));
    if (sent) {
      needs_email_verification = true;
    } else {
      // Email delivery is unavailable — confirm the account immediately so the
      // member is never locked out of their brand-new account.
      logUndeliveredCode("verification (auto-confirming account)", email, code);
      await admin.auth.admin
        .updateUserById(data.user.id, { email_confirm: true })
        .then(({ error: confirmError }) => {
          if (confirmError) throw confirmError;
        });
      await admin
        .from("users")
        .update({ email_verified_at: new Date().toISOString() })
        .eq("id", data.user.id);
      dev_code = code;
    }
  }

  return { user_id: data.user?.id, email, needs_email_verification, dev_code };
}

async function login(input: { email?: string; password?: string }) {
  const admin = createAdminClient();
  // A leftover impersonation cookie would otherwise outrank the new session
  // and bounce the signed-in admin straight back to the login page.
  await clearImpersonationCookies();

  let email: string | null = null;

  // Email + password login path — establishes the browser session directly.
  if (input.email && input.password) {
    const sb = await createServerClient();
    const { data: authData, error } = await sb.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });
    if (error?.code === "email_not_confirmed") {
      throw new DbError(
        "email_not_confirmed",
        "Your email isn't confirmed yet. Use “Forgot Password?” to confirm it and set a new password.",
        401,
      );
    }
    if (error || !authData.user) {
      throw new DbError("invalid_credentials", "Email or password is incorrect.", 401);
    }
    const { data: user } = await admin
      .from("users")
      .select("status, email")
      .eq("id", authData.user.id)
      .single();
    const row = user as { status?: string; email?: string } | null;
    if (!row || row.status !== "active") {
      throw new DbError("account_disabled", "This account is disabled.");
    }
    email = row.email ?? null;
  }

  if (!email) throw new DbError("invalid_credentials", "Email or password is incorrect.", 401);

  return { ok: true };
}

async function login2fa(input: { challenge: string; code: string }) {
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("twofa_codes")
    .select("*")
    .eq("challenge", input.challenge)
    .is("used_at", null)
    .limit(1);
  const row = firstRow(rows);
  if (!row || !row.user_id) throw new DbError("challenge_expired", "Please sign in again.", 410);
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new DbError("challenge_expired", "That took too long — please sign in again.", 410);
  }

  const { data: userRow } = await admin
    .from("users")
    .select("email")
    .eq("id", row.user_id)
    .single();
  if (!userRow) throw new DbError("challenge_expired", "Please sign in again.", 410);

  // Verify the emailed OTP through the cookie-backed client so the session is
  // established in the browser.
  const sb = await createServerClient();
  const { error } = await sb.auth.verifyOtp({
    email: (userRow as { email: string }).email,
    token: input.code,
    type: "email",
  });
  if (error) throw new DbError("invalid_code", "That code is wrong.");

  await admin.from("twofa_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);

  return { ok: true };
}

async function forgotPassword(input: { email: string }) {
  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();
  if (!email) throw new DbError("invalid_email", "Enter your email address.");

  const code = generateNumericCode();
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await admin.from("password_resets").insert({
    email,
    code_hash: (await hashPassword(code)).hash,
    expires_at: expires,
  });

  const sent = await deliver(email, passwordResetCodeEmail(code, await siteNameForEmail()));
  if (!sent) {
    // The code is never surfaced to the browser — it must arrive by email.
    logUndeliveredCode("password reset (delivery failed)", email, code);
    throw new DbError(
      "email_unavailable",
      "We couldn't send the reset email right now. Please contact support.",
      503,
    );
  }
  return { ok: true };
}

async function resetPassword(input: { email: string; code: string; password: string }) {
  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();
  if (!input.password || input.password.length < 8) {
    throw new DbError("weak_password", "Password must be at least 8 characters.");
  }
  const { data: rows } = await admin
    .from("password_resets")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1);
  const row = firstRow(rows) as (PasswordResetRow & { code_hash?: string }) | null;
  if (!row || !row.code_hash || new Date(row.expires_at).getTime() < Date.now()) {
    throw new DbError("invalid_or_expired_code", "Code is wrong or expired.", 410);
  }
  if (!(await verifyPassword(input.code, row.code_hash))) {
    throw new DbError("invalid_or_expired_code", "Code is wrong or expired.", 410);
  }

  const { data: user } = await admin.from("users").select("id").eq("email", email).single();
  if (!user) throw new DbError("invalid_or_expired_code", "Code is wrong or expired.", 410);

  // The emailed code proves the member owns this address, so confirm it too —
  // otherwise an unconfirmed account can never sign in with the new password.
  const { error } = await admin.auth.admin.updateUserById((user as { id: string }).id, {
    password: input.password,
    email_confirm: true,
  });
  if (error) throw new DbError("reset_failed", error.message, 500);

  await admin.from("password_resets").delete().eq("email", email);
  return { ok: true };
}

async function logout() {
  await clearImpersonationCookies();
  const sb = await createServerClient();
  await sb.auth.signOut();
  return { ok: true };
}

/** Email awaiting verification: the pending-verify cookie, else the signed-in member. */
async function pendingVerifyEmail(): Promise<string | null> {
  const store = await cookies();
  const fromCookie = store.get(PENDING_VERIFY_COOKIE)?.value?.trim().toLowerCase();
  if (fromCookie) return fromCookie;
  const user = await currentUser();
  return user?.email ? user.email.trim().toLowerCase() : null;
}

async function verifyEmail(input: { code: string }) {
  const admin = createAdminClient();
  const store = await cookies();
  const email = await pendingVerifyEmail();
  if (!email) throw new DbError("not_authenticated", "Please sign in again.", 401);

  const { data: rows } = await admin
    .from("email_verifications")
    .select("*")
    .eq("email", email)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const row = firstRow(rows) as (EmailVerificationRow & { code_hash?: string }) | null;
  if (!row || !row.code_hash || new Date(row.expires_at).getTime() < Date.now()) {
    throw new DbError("invalid_or_expired_code", "Code is wrong or expired.", 410);
  }
  if (!(await verifyPassword(String(input.code ?? ""), row.code_hash))) {
    throw new DbError("invalid_or_expired_code", "Code is wrong or expired.", 410);
  }

  await admin.from("email_verifications").update({ used_at: new Date().toISOString() }).eq("id", row.id);
  await admin.auth.admin.updateUserById(row.user_id, { email_confirm: true });
  await admin
    .from("users")
    .update({ email_verified_at: new Date().toISOString() })
    .eq("id", row.user_id);
  store.delete(PENDING_VERIFY_COOKIE);
  return { ok: true };
}

async function resendVerifyCode() {
  const admin = createAdminClient();
  const email = await pendingVerifyEmail();
  if (!email) throw new DbError("not_authenticated", "Please sign in again.", 401);

  const { data: userRow } = await admin
    .from("users")
    .select("id, email_verified_at")
    .eq("email", email)
    .single();
  const row = userRow as { id: string; email_verified_at?: string | null } | null;
  if (!row) throw new DbError("not_authenticated", "Please sign in again.", 401);
  if (row.email_verified_at) return { already_verified: true, resend_in: 0 };

  const code = generateNumericCode();
  await admin.from("email_verifications").insert({
    user_id: row.id,
    email,
    code_hash: (await hashPassword(code)).hash,
    expires_at: new Date(Date.now() + VERIFY_CODE_TTL_MS).toISOString(),
  });
  const sent = await deliver(email, verificationCodeEmail(code, await siteNameForEmail()));
  if (!sent) logUndeliveredCode("verification (resend)", email, code);
  return { resend_in: 10 };
}

async function resendVerifyStatus() {
  return { resend_in: 10 };
}

/* ------------------------------------------------------------------------- */
/* Admin                                                                     */
/* ------------------------------------------------------------------------- */

async function requireAdmin(): Promise<UserRow> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new DbError("forbidden", "You do not have access to this area.", 403);
  }
  return user;
}

/** Record a sensitive administrative action for the audit trail. */
async function writeAudit(input: {
  action: string;
  target_type?: string;
  target_id?: string;
  target_label?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const actor = await currentUser();
    await createAdminClient()
      .from("audit_logs")
      .insert({
        admin_id: actor?.id ?? null,
        admin_email: actor?.email ?? null,
        action: input.action,
        target_type: input.target_type ?? null,
        target_id: input.target_id ?? null,
        target_label: input.target_label ?? null,
        details: input.details ?? {},
      });
  } catch (error) {
    console.error("[audit] failed to record action:", (error as Error).message);
  }
}

/** Every permission an admin role holds; sub-admin tiers can narrow this later. */
const ADMIN_PERMISSIONS = [
  "super",
  "users",
  "kyc",
  "crm",
  "referrals",
  "deposits",
  "withdrawals",
  "cards",
  "card_settings",
  "currencies",
  "loans",
  "grants",
  "irs",
  "memberships",
  "plans",
  "crypto",
  "signals",
  "copy_trading",
  "courses",
  "contact_inbox",
  "broadcast",
  "chat",
  "agents",
  "content",
  "appearance",
  "themes",
  "audit",
  "settings",
];

async function adminMe(slug?: string) {
  const [site, user] = await Promise.all([resolveSite(slug), requireAdmin()]);
  return {
    site,
    user: mapUser(user),
    admin: {
      permissions: user.role === "admin" ? ADMIN_PERMISSIONS : [],
      is_super: true,
    },
  };
}

async function adminOverview() {
  await requireAdmin();
  const admin = createAdminClient();

  const [users, deposits, withdrawals, blocked] = await Promise.all([
    admin.from("users").select("id"),
    admin.from("deposits").select("amount,status"),
    admin.from("withdrawals").select("amount,status"),
    admin
      .from("users")
      .select("id")
      .in("status", ["blocked", "disabled", "restricted", "suspended"]),
  ]);

  const totalDeposits = (deposits.data ?? []).reduce(
    (sum, d) => sum + Number(d.amount ?? 0),
    0,
  );
  const pendingDeposits = (deposits.data ?? [])
    .filter((d) => d.status === "processing" || d.status === "pending")
    .reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
  const totalTransfers = (withdrawals.data ?? []).reduce(
    (sum, w) => sum + Number(w.amount ?? 0),
    0,
  );
  const pendingTransfers = (withdrawals.data ?? [])
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + Number(w.amount ?? 0), 0);

  return {
    counts: {
      currency: (await resolveSite(undefined)).primary_currency ?? "USD",
      total_deposits: totalDeposits,
      pending_deposits: pendingDeposits,
      total_transfers: totalTransfers,
      pending_transfers: pendingTransfers,
      total_users: users.data?.length ?? 0,
      active_users: (users.data?.length ?? 0) - (blocked.data?.length ?? 0),
      blocked_users: blocked.data?.length ?? 0,
    },
  };
}

async function adminUsers(search?: string, status?: string) {
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (search) query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return { users: (data ?? []).map(mapUser) };
}

async function adminTransactions(limit = 100) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { transactions: (data ?? []).map(mapTransaction) };
}

/* ------------------------------------------------------------------------- */
/* Admin: deposits / withdrawals / cards / loans / grants / user management  */
/* ------------------------------------------------------------------------- */

interface AdminListOptions {
  search?: string;
  status?: string;
}

type AdminRow<T> = T & { email?: string; full_name?: string };

async function fetchListWithUsers<T>(
  table: string,
  opts: AdminListOptions,
  searchColumns: string[],
  orderColumn = "created_at",
): Promise<AdminRow<T>[]> {
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin
    .from(table)
    .select("*, users(email, first_name, last_name)")
    .order(orderColumn, { ascending: false })
    .limit(200);
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search && searchColumns.length > 0) {
    const term = `%${opts.search.trim()}%`;
    const filters = searchColumns.map((col) => `${col}.ilike.${term}`);
    // Search by email on the related users relation as well.
    filters.push(`users.email.ilike.${term}`);
    query = query.or(filters.join(","));
  }
  const { data, error } = await query;
  if (error) throw new DbError("list_failed", error.message, 500);
  return (((data ?? []) as Record<string, unknown>[]).map((row) => {
    const rel = row.users as
      | { email?: string; first_name?: string; last_name?: string }
      | null
      | undefined;
    const { users: _users, ...rest } = row;
    return {
      ...(rest as T),
      email: rel?.email,
      full_name: `${rel?.first_name ?? ""} ${rel?.last_name ?? ""}`.trim() || undefined,
    };
  }) as AdminRow<T>[]);
}

async function adminDeposits(
  opts: AdminListOptions = {},
): Promise<{ deposits: AdminRow<DepositRow>[] }> {
  return { deposits: await fetchListWithUsers<DepositRow>("deposits", opts, ["method", "reference"]) };
}

async function setDepositStatus(input: { id?: string; status?: string }) {
  const admin = createAdminClient();
  await requireAdmin();
  if (!input.id || !input.status) {
    throw new DbError("invalid_request", "Missing deposit id or status.");
  }
  const allowed = ["processing", "completed", "failed"];
  if (!allowed.includes(input.status)) {
    throw new DbError("invalid_status", "Unsupported status.");
  }
  const { data: rows } = await admin.from("deposits").select("*").eq("id", input.id).limit(1);
  const deposit = firstRow(rows) as DepositRow | null;
  if (!deposit) throw new DbError("not_found", "Deposit not found.", 404);
  if (deposit.status === input.status) return { ok: true };

  // Conditional update guards against approving the same deposit twice.
  const { data: claimed, error: claimError } = await admin
    .from("deposits")
    .update({ status: input.status })
    .eq("id", deposit.id)
    .neq("status", "completed")
    .select("id");
  if (claimError) throw new DbError("update_failed", claimError.message, 500);
  if (!claimed || claimed.length === 0) {
    // Another admin already completed this deposit.
    return { ok: true };
  }
  await writeAudit({
    action: `deposit.${input.status}`,
    target_type: "deposit",
    target_id: deposit.id,
    target_label: deposit.reference ?? undefined,
    details: { user_id: deposit.user_id, amount: deposit.amount, currency: deposit.currency, from: deposit.status, to: input.status },
  });

  if (input.status === "completed" && deposit.status !== "completed") {
    const sb = await createServerClient();
    const { data: account } = await admin
      .from("accounts")
      .select("id, balance")
      .eq("user_id", deposit.user_id)
      .eq("currency", deposit.currency)
      .single();
    await admin.rpc("credit_account", {
      p_user_id: deposit.user_id,
      p_amount: Number(deposit.amount),
      p_currency: deposit.currency,
    });
    await admin.from("transactions").insert({
      user_id: deposit.user_id,
      account_id: account?.id ?? null,
      kind: "deposit",
      direction: "credit",
      amount: deposit.amount,
      currency: deposit.currency,
      name: "Deposit",
      reference: deposit.reference,
      status: "completed",
      balance_after:
        account != null
          ? (Number(account.balance) + Number(deposit.amount)).toString()
          : null,
    });
    const { data: depositUser } = await admin
      .from("users")
      .select("email, first_name, last_name")
      .eq("id", deposit.user_id)
      .single();
    const depositOwner = depositUser as { email: string; first_name?: string; last_name?: string } | null;
    if (depositOwner?.email) {
      await deliver(
        depositOwner.email,
        depositApprovedEmail({
          siteName: await siteNameForEmail(),
          name: `${depositOwner.first_name ?? ""} ${depositOwner.last_name ?? ""}`.trim() || "there",
          amount: Number(deposit.amount),
          currency: deposit.currency,
          method: deposit.method,
          reference: deposit.reference,
          balance: account != null ? Number(account.balance) + Number(deposit.amount) : null,
        }),
      );
    }
    await admin.from("notifications").insert({
      user_id: deposit.user_id,
      title: "Deposit approved",
      body: `Your deposit of ${deposit.currency} ${Number(deposit.amount).toLocaleString()} has been credited.`,
      link: "/deposits",
    });
  }

  if (input.status === "failed" && deposit.status !== "failed") {
    await admin.from("notifications").insert({
      user_id: deposit.user_id,
      title: "Deposit declined",
      body: `Your deposit of ${deposit.currency} ${Number(deposit.amount).toLocaleString()} was declined.`,
      link: "/deposits",
    });
  }
  return { ok: true };
}

async function adminWithdrawals(
  opts: AdminListOptions = {},
): Promise<{ withdrawals: AdminRow<WithdrawalRow>[] }> {
  return {
    withdrawals: await fetchListWithUsers<WithdrawalRow>("withdrawals", opts, [
      "method",
      "account_number",
      "reference",
    ]),
  };
}

async function setWithdrawalStatus(input: { id?: string; status?: string }) {
  const admin = createAdminClient();
  await requireAdmin();
  if (!input.id || !input.status) {
    throw new DbError("invalid_request", "Missing withdrawal id or status.");
  }
  const allowed = ["pending", "processing", "completed", "rejected", "failed"];
  if (!allowed.includes(input.status)) {
    throw new DbError("invalid_status", "Unsupported status.");
  }
  const { data: rows } = await admin.from("withdrawals").select("*").eq("id", input.id).limit(1);
  const withdrawal = firstRow(rows) as WithdrawalRow | null;
  if (!withdrawal) throw new DbError("not_found", "Withdrawal not found.", 404);
  if (withdrawal.status === input.status) return { ok: true };

  const refunding =
    (input.status === "rejected" || input.status === "failed") &&
    withdrawal.status !== "rejected" &&
    withdrawal.status !== "failed";

  await admin.from("withdrawals").update({ status: input.status }).eq("id", withdrawal.id);
  await writeAudit({
    action: `withdrawal.${input.status}`,
    target_type: "withdrawal",
    target_id: withdrawal.id,
    target_label: withdrawal.account_number ?? undefined,
    details: { user_id: withdrawal.user_id, amount: withdrawal.amount, currency: withdrawal.currency, from: withdrawal.status, to: input.status, refunded: refunding },
  });

  if (input.status === "completed") {
    // Approval is the moment the reserved money actually leaves the balance.
    await settleWithdrawalHold(withdrawal as HoldWithdrawal);
  } else if (refunding) {
    // Rejected/failed: simply give the reservation back — no extra "reversal"
    // credit row, because the money never left the balance.
    await releaseWithdrawalHold(withdrawal as HoldWithdrawal);
  }


  if (["completed", "rejected", "failed"].includes(input.status)) {
    const { data: wUser } = await admin
      .from("users")
      .select("email, first_name, last_name")
      .eq("id", withdrawal.user_id)
      .single();
    const owner = wUser as { email: string; first_name?: string; last_name?: string } | null;
    const { data: wAccount } = await admin
      .from("accounts")
      .select("balance")
      .eq("user_id", withdrawal.user_id)
      .eq("currency", withdrawal.currency)
      .maybeSingle();
    if (owner?.email) {
      await deliver(
        owner.email,
        withdrawalStatusEmail({
          siteName: await siteNameForEmail(),
          name: `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim() || "there",
          amount: Number(withdrawal.amount),
          currency: withdrawal.currency,
          method: withdrawal.method,
          reference: withdrawal.reference,
          status: input.status,
          balance: wAccount ? Number((wAccount as { balance: string }).balance) : null,
        }),
      );
    }
  }

  const txnStatus =
    input.status === "completed" ? "completed" : input.status === "pending" ? "pending" : "failed";
  await admin
    .from("transactions")
    .update({ status: txnStatus })
    .eq("user_id", withdrawal.user_id)
    .eq("kind", "withdrawal")
    .eq("reference", withdrawal.id)
    .eq("status", "pending");


  const titles: Record<string, string> = {
    completed: "Withdrawal approved",
    rejected: "Withdrawal rejected",
    failed: "Withdrawal failed",
    processing: "Withdrawal processing",
  };
  await admin.from("notifications").insert({
    user_id: withdrawal.user_id,
    title: titles[input.status] ?? "Withdrawal updated",
    body:
      input.status === "completed"
        ? `Your withdrawal of ${withdrawal.currency} ${Number(withdrawal.amount).toLocaleString()} has been sent.`
        : refunding
          ? `Your withdrawal of ${withdrawal.currency} ${Number(withdrawal.amount).toLocaleString()} was returned to your balance.`
          : `Withdrawal status updated to ${input.status}.`,
    link: "/withdrawals",
  });
  return { ok: true };
}

async function adminCards(): Promise<{
  cards: AdminRow<CardRow>[];
  applications: AdminRow<CardApplicationRow>[];
}> {
  const [cards, applications] = await Promise.all([
    fetchListWithUsers<CardRow>("cards", {}, ["brand", "holder", "last4"]),
    fetchListWithUsers<CardApplicationRow>("card_applications", {}, ["card_type"]),
  ]);
  return { cards, applications };
}

async function setCardStatus(input: { id?: string; status?: string; frozen?: boolean }) {
  const admin = createAdminClient();
  await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing card id.");
  const patch: Record<string, unknown> = {};
  if (input.frozen !== undefined) patch.frozen = input.frozen;
  if (input.status) {
    const allowed = ["active", "inactive", "blocked", "closed", "expired"];
    if (!allowed.includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
    patch.status = input.status;
  }
  if (Object.keys(patch).length === 0) {
    throw new DbError("invalid_request", "Nothing to update.");
  }
  const { error } = await admin.from("cards").update(patch).eq("id", input.id);
  if (error) throw new DbError("update_failed", error.message, 500);
  await writeAudit({ action: "card.update", target_type: "card", target_id: input.id, details: patch });
  return { ok: true };
}

async function setCardApplicationStatus(input: { id?: string; status?: string }) {
  const admin = createAdminClient();
  await requireAdmin();
  if (!input.id || !input.status) {
    throw new DbError("invalid_request", "Missing application id or status.");
  }
  const allowed = ["pending", "approved", "declined"];
  if (!allowed.includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
  const { data: rows } = await admin
    .from("card_applications")
    .select("*")
    .eq("id", input.id)
    .limit(1);
  const app = firstRow(rows) as CardApplicationRow | null;
  if (!app) throw new DbError("not_found", "Application not found.", 404);

  await admin.from("card_applications").update({ status: input.status }).eq("id", app.id);
  await writeAudit({
    action: `card_application.${input.status}`,
    target_type: "card_application",
    target_id: app.id,
    details: { user_id: app.user_id, card_type: app.card_type, from: app.status, to: input.status },
  });

  if (input.status === "approved" && app.status !== "approved") {
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    const { data: ownerRows } = await admin
      .from("users")
      .select("first_name,last_name,full_name")
      .eq("id", app.user_id)
      .limit(1);
    const owner = firstRow(ownerRows) as
      | { first_name?: string | null; last_name?: string | null; full_name?: string | null }
      | null;
    const holder =
      (owner?.full_name?.trim() ||
        `${owner?.first_name ?? ""} ${owner?.last_name ?? ""}`.trim() ||
        "Card Holder").toUpperCase();
    const brandRaw = String((app as { card_brand?: string }).card_brand ?? "visa");
    const brand = brandRaw.charAt(0).toUpperCase() + brandRaw.slice(1);
    await admin.from("cards").insert({
      user_id: app.user_id,
      brand,
      card_type: app.card_type,
      last4,
      holder,
      expiry: `${String(new Date().getMonth() + 1).padStart(2, "0")}/${String(new Date().getFullYear() % 100 + 3).padStart(2, "0")}`,
      status: "active",
      spent: "0",
      frozen: false,
      limit_amount: (app as { daily_limit?: number | null }).daily_limit ?? null,
    });
    await admin.from("notifications").insert({
      user_id: app.user_id,
      title: "Card approved",
      body: `Your ${app.card_type} card application was approved and issued.`,
      link: "/cards",
    });
  }
  return { ok: true };
}

async function adminLoans(
  opts: AdminListOptions = {},
): Promise<{ loans: AdminRow<LoanRow>[] }> {
  return { loans: await fetchListWithUsers<LoanRow>("loans", opts, []) };
}

async function setLoanStatus(input: { id?: string; status?: string }) {
  const admin = createAdminClient();
  await requireAdmin();
  if (!input.id || !input.status) {
    throw new DbError("invalid_request", "Missing loan id or status.");
  }
  const allowed = ["pending", "approved", "active", "rejected", "completed", "declined"];
  if (!allowed.includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
  const { data: rows } = await admin.from("loans").select("*").eq("id", input.id).limit(1);
  const loan = firstRow(rows) as LoanRow | null;
  if (!loan) throw new DbError("not_found", "Loan not found.", 404);

  await admin.from("loans").update({ status: input.status }).eq("id", loan.id);
  await writeAudit({
    action: `loan.${input.status}`,
    target_type: "loan",
    target_id: loan.id,
    details: { user_id: loan.user_id, amount: loan.amount, from: loan.status, to: input.status },
  });

  if (input.status === "approved" && loan.status !== "approved") {
    const sb = await createServerClient();
    const { data: account } = await admin
      .from("accounts")
      .select("id, balance, currency")
      .eq("user_id", loan.user_id)
      .single();
    await admin.rpc("credit_account", {
      p_user_id: loan.user_id,
      p_amount: Number(loan.amount),
      p_currency: account?.currency ?? "USD",
    });
    const { error: loanTxError } = await admin.from("transactions").insert({
      user_id: loan.user_id,
      account_id: account?.id ?? null,
      kind: "credited",
      direction: "credit",
      amount: loan.amount,
      currency: account?.currency ?? "USD",
      name: "Loan disbursement",
      status: "completed",
      balance_after:
        account != null
          ? (Number(account.balance) + Number(loan.amount)).toString()
          : null,
    });
    if (loanTxError) throw new DbError("update_failed", loanTxError.message, 500);
    await admin.from("notifications").insert({
      user_id: loan.user_id,
      title: "Loan approved",
      body: `Your loan of ${Number(loan.amount).toLocaleString()} has been disbursed.`,
      link: "/loans",
    });
  }
  return { ok: true };
}

async function adminGrants(
  opts: AdminListOptions = {},
): Promise<{ grants: AdminRow<GrantRow>[] }> {
  return { grants: await fetchListWithUsers<GrantRow>("grants", opts, ["program"]) };
}

async function setGrantStatus(input: { id?: string; status?: string }) {
  const admin = createAdminClient();
  await requireAdmin();
  if (!input.id || !input.status) {
    throw new DbError("invalid_request", "Missing grant id or status.");
  }
  const allowed = ["pending", "approved", "rejected", "completed", "declined"];
  if (!allowed.includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
  const { error } = await admin.from("grants").update({ status: input.status }).eq("id", input.id);
  if (error) throw new DbError("update_failed", error.message, 500);
  await writeAudit({ action: `grant.${input.status}`, target_type: "grant", target_id: input.id, details: { from: input.status } });
  return { ok: true };
}

async function adminSetUserStatus(input: { id?: string; status?: string }) {
  const admin = createAdminClient();
  await requireAdmin();
  if (!input.id || !input.status) {
    throw new DbError("invalid_request", "Missing user id or status.");
  }
  const allowed = ["active", "suspended", "disabled"];
  if (!allowed.includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
  const { error } = await admin.from("users").update({ status: input.status }).eq("id", input.id);
  if (error) throw new DbError("update_failed", error.message, 500);
  await writeAudit({ action: `user.${input.status}`, target_type: "user", target_id: input.id, details: { to: input.status } });
  return { ok: true };
}

async function adminUserDetail(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing user id.");
  const admin = createAdminClient();
  const { data: rows } = await admin.from("users").select("*").eq("id", id).limit(1);
  const user = firstRow(rows) as UserRow | null;
  if (!user) throw new DbError("not_found", "User not found.", 404);
  const [accountsRes, txRes, cardsRes, kycRes] = await Promise.all([
    admin.from("accounts").select("*").eq("user_id", id),
    admin
      .from("transactions")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("cards").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    admin.from("settings").select("security").eq("user_id", id).maybeSingle(),
  ]);
  const security = (kycRes.data as { security?: Record<string, unknown> } | null)?.security ?? {};
  return {
    user: mapUser(user),
    accounts: accountsRes.data ?? [],
    transactions: (txRes.data ?? []).map(mapTransaction),
    cards: cardsRes.data ?? [],
    kyc: (security.kyc && typeof security.kyc === "object" ? security.kyc : {}) as Record<string, unknown>,
  };
}

/* ------------------------------------------------------------------------- */
/* Admin: user management                                                    */
/* ------------------------------------------------------------------------- */

async function adminUpdateUser(input: {
  id?: string;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  country?: string;
  status?: string;
  kyc_status?: string;
  email_verified?: boolean;
  mask_payment_details?: boolean;
  password?: string;
  pin?: string;
}) {
  await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing user id.");
  const patch: Record<string, unknown> = {};
  if (input.first_name !== undefined) patch.first_name = input.first_name.trim();
  if (input.last_name !== undefined) patch.last_name = input.last_name.trim();
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.country !== undefined) patch.country = input.country;
  if (input.status !== undefined) {
    if (!["active", "suspended", "disabled"].includes(input.status)) {
      throw new DbError("invalid_status", "Unsupported status.");
    }
    patch.status = input.status;
  }
  if (input.kyc_status !== undefined) {
    if (!["not_submitted", "in_review", "verified", "rejected"].includes(input.kyc_status)) {
      throw new DbError("invalid_status", "Unsupported KYC status.");
    }
    patch.kyc_status = input.kyc_status;
  }
  if (input.mask_payment_details !== undefined) {
    patch.mask_payment_details = Boolean(input.mask_payment_details);
  }
  const admin = createAdminClient();
  const { data: before } = await admin.from("users").select("email").eq("id", input.id).single();
  if (Object.keys(patch).length > 0) {
    const { error } = await admin.from("users").update(patch).eq("id", input.id);
    if (error) throw new DbError("update_failed", error.message, 500);
  }
  // Admin-assisted credential resets. The secrets themselves are never stored
  // in plain text or written to the audit log — only the fact they were set.
  if (input.password !== undefined) {
    const password = input.password.trim();
    if (password.length < 8) {
      throw new DbError("weak_password", "The password must be at least 8 characters.");
    }
    const { error: pwErr } = await admin.auth.admin.updateUserById(input.id, { password });
    if (pwErr) throw new DbError("update_failed", pwErr.message, 500);
    patch.password_set = true;
  }
  if (input.pin !== undefined) {
    const pin = input.pin.trim();
    if (!/^\d{4,6}$/.test(pin)) {
      throw new DbError("invalid_pin", "The PIN must be 4 to 6 digits.");
    }
    const { hash } = await hashPassword(pin);
    const { error: pinErr } = await admin.from("users").update({ pin_hash: hash }).eq("id", input.id);
    if (pinErr) throw new DbError("update_failed", pinErr.message, 500);
    patch.pin_set = true;
  }
  if (Object.keys(patch).length === 0) {
    throw new DbError("invalid_request", "Nothing to update.");
  }
  // Email verification is mirrored onto the auth account so sign-in works.
  if (input.email_verified !== undefined && before?.email) {
    const { error: authErr } = await admin.auth.admin.updateUserById(input.id, {
      email_confirm: input.email_verified,
    });
    if (authErr) throw new DbError("update_failed", authErr.message, 500);
    patch.email_verified_at = input.email_verified ? new Date().toISOString() : null;
    await admin.from("users").update({ email_verified_at: patch.email_verified_at }).eq("id", input.id);
  }
  await writeAudit({
    action: "user.update",
    target_type: "user",
    target_id: input.id,
    target_label: before?.email,
    details: patch as Record<string, unknown>,
  });
  const { data: fresh } = await admin.from("users").select("*").eq("id", input.id).single();
  return { ok: true, user: mapUser(fresh as UserRow) };
}

async function adminAdjustBalance(input: {
  user_id?: string;
  currency?: string;
  amount?: number | string;
  direction?: "credit" | "debit";
  reason?: string;
}) {
  await requireAdmin();
  const amount = parseAmountInput(input.amount);
  if (!input.user_id || !amount || amount <= 0) {
    throw new DbError("invalid_amount", "Enter a valid positive amount (e.g. 250 or 1,000.50).");
  }
  const direction = input.direction === "debit" ? "debit" : "credit";
  const currency = input.currency || "USD";
  const admin = createAdminClient();

  const { data: rows, error: userError } = await admin
    .from("users")
    .select("email")
    .eq("id", input.user_id)
    .single();
  if (userError) throw new DbError("lookup_failed", "The member account could not be loaded.", 500);
  if (!rows) throw new DbError("not_found", "User not found.", 404);

  const rpc = direction === "credit" ? "credit_account" : "debit_account";
  const { data: account, error: rpcError } = await admin.rpc(rpc, {
    p_user_id: input.user_id,
    p_amount: amount,
    p_currency: currency,
  });
  if (rpcError) {
    throw new DbError(
      rpcError.message.includes("insufficient_funds") ? "insufficient_funds" : "adjustment_failed",
      rpcError.message.includes("insufficient_funds")
        ? "The user has insufficient funds for this deduction."
        : rpcError.message.includes("no_active_account")
          ? `This member does not have an active ${currency} account.`
          : "The balance could not be adjusted. Please try again.",
      400,
    );
  }

  const { error: transactionError } = await admin.from("transactions").insert({
    user_id: input.user_id,
    account_id: account?.id ?? null,
    kind: "adjustment",
    direction,
    amount,
    currency,
    name: direction === "credit" ? "Bank Transfer" : "Bank Debit",
    reference: input.reason ?? null,
    status: "completed",
    balance_after: account != null ? String(account.balance) : null,
  });
  if (transactionError) {
    throw new DbError("history_failed", "The balance changed, but its transaction record could not be saved.", 500);
  }

  await admin.from("notifications").insert({
    user_id: input.user_id,
    title: direction === "credit" ? "Incoming Bank Transfer" : "Bank Debit",
    body:
      direction === "credit"
        ? `A bank transfer of ${currency} ${amount.toLocaleString()} has been credited to your account.`
        : `A debit of ${currency} ${amount.toLocaleString()} has been applied to your account.`,
    link: "/transactions",
  });

  await writeAudit({
    action: `balance.${direction}`,
    target_type: "account",
    target_id: input.user_id,
    target_label: (rows as { email: string }).email,
    details: { amount, currency, reason: input.reason ?? null },
  });
  return { ok: true, balance_after: account?.balance ?? null };
}

async function adminCreateTransaction(input: {
  user_id?: string;
  kind?: string;
  direction?: "credit" | "debit";
  amount?: number | string;
  name?: string;
  apply_balance?: boolean;
  /** balance = balance only, history = history only, both = balance + history */
  mode?: "balance" | "history" | "both";
}) {
  await requireAdmin();
  const amount = parseAmountInput(input.amount);
  if (!input.user_id || !amount || amount <= 0) {
    throw new DbError("invalid_amount", "Enter a valid positive amount (e.g. 250 or 1,000.50).");
  }
  const direction = input.direction === "debit" ? "debit" : "credit";
  const allowedKinds = ["deposit", "withdrawal", "transfer", "adjustment", "credited", "grant"];
  const kind = allowedKinds.includes(input.kind ?? "") ? (input.kind as string) : "adjustment";
  const currency = "USD";
  const admin = createAdminClient();

  const { data: rows, error: userError } = await admin
    .from("users")
    .select("email")
    .eq("id", input.user_id)
    .single();
  if (userError) throw new DbError("lookup_failed", "The member account could not be loaded.", 500);
  if (!rows) throw new DbError("not_found", "User not found.", 404);

  let accountId: string | null = null;
  let balanceAfter: string | null = null;
  const mode: "balance" | "history" | "both" =
    input.mode === "balance" || input.mode === "history" || input.mode === "both"
      ? input.mode
      : input.apply_balance === false
        ? "history"
        : "both";
  const apply = mode !== "history";
  const writeHistory = mode !== "balance";
  if (apply) {
    const rpc = direction === "credit" ? "credit_account" : "debit_account";
    const { data: account, error: rpcError } = await admin.rpc(rpc, {
      p_user_id: input.user_id,
      p_amount: amount,
      p_currency: currency,
    });
    if (rpcError) {
      throw new DbError(
        rpcError.message.includes("insufficient_funds") ? "insufficient_funds" : "transaction_failed",
        rpcError.message.includes("insufficient_funds")
          ? "The user has insufficient funds."
          : rpcError.message.includes("no_active_account")
            ? `This member does not have an active ${currency} account.`
            : "The transaction could not be applied. Please try again.",
        400,
      );
    }
    accountId = account?.id ?? null;
    balanceAfter = account != null ? String(account.balance) : null;
  }

  const transactionResult = writeHistory
    ? await admin
    .from("transactions")
    .insert({
      user_id: input.user_id,
      account_id: accountId,
      kind,
      direction,
      amount,
      currency,
      name:
        input.name?.trim() ||
        (kind === "credited" || kind === "adjustment"
          ? direction === "credit"
            ? "Bank Transfer"
            : "Bank Debit"
          : kind.charAt(0).toUpperCase() + kind.slice(1)),
      status: "completed",
      balance_after: balanceAfter,
    })
    .select()
    .single()
    : { data: null, error: null };
  if (transactionResult.error) {
    throw new DbError("history_failed", "The transaction history could not be saved.", 500);
  }
  const txn = transactionResult.data;

  await writeAudit({
    action: "transaction.create",
    target_type: "transaction",
    target_id: (txn as { id?: string })?.id,
    target_label: (rows as { email: string }).email,
    details: { user_id: input.user_id, kind, direction, amount, mode },
  });
  return { ok: true, transaction: txn };
}

async function adminDeleteUser(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing user id.");
  const admin = createAdminClient();
  const { data: rows } = await admin.from("users").select("email, role").eq("id", id).single();
  if (!rows) throw new DbError("not_found", "User not found.", 404);
  const target = rows as { email: string; role: string };
  if ((await currentUser())?.id === id) {
    throw new DbError("forbidden", "You cannot delete your own account.", 403);
  }
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    // Fall back to removing the application row (cascades to all related data)
    // so a stuck auth record cannot block the admin from deleting the member.
    const { error: rowError } = await admin.from("users").delete().eq("id", id);
    if (rowError) {
      throw new DbError("delete_failed", error.message || rowError.message, 500);
    }
  }
  await writeAudit({
    action: "user.delete",
    target_type: "user",
    target_id: id,
    target_label: target.email,
    details: { role: target.role },
  });
  return { ok: true };
}

/** Verify a user's password by attempting a throwaway sign-in. */
async function verifyAccountPassword(email: string, password: string): Promise<boolean> {
  if (!password) return false;
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"] ?? "";
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["SUPABASE_ANON_KEY"] ??
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    "";
  const probe = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await probe.auth.signInWithPassword({ email, password });
  return !error;
}

async function changePassword(input: { current_password?: string; new_password?: string }) {
  const user = await requireUser();
  const next = String(input.new_password ?? "");
  if (next.length < 8) {
    throw new DbError("weak_password", "Your new password must be at least 8 characters.");
  }
  if (!(await verifyAccountPassword(user.email, String(input.current_password ?? "")))) {
    throw new DbError("invalid_password", "Your current password is incorrect.", 400);
  }
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: next });
  if (error) throw new DbError("update_failed", error.message, 500);
  await admin.from("notifications").insert({
    user_id: user.id,
    title: "Password changed",
    body: "Your account password was changed. If this wasn't you, contact support immediately.",
    link: "/settings/security",
  });
  return { ok: true };
}

async function securityStatus() {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("twofa_enabled, pin_hash, email_verified_at, updated_at")
    .eq("id", user.id)
    .single();
  const row = data as
    | { twofa_enabled: boolean; pin_hash: string | null; email_verified_at: string | null; updated_at: string }
    | null;
  return {
    twofa_enabled: Boolean(row?.twofa_enabled),
    twofa_method: "email" as const,
    pin_set: Boolean(row?.pin_hash),
    email: user.email,
    email_verified: Boolean(row?.email_verified_at),
    updated_at: row?.updated_at ?? null,
  };
}

async function setTwofa(input: { enabled?: boolean; current_password?: string }) {
  const user = await requireUser();
  const enabled = Boolean(input.enabled);
  if (!(await verifyAccountPassword(user.email, String(input.current_password ?? "")))) {
    throw new DbError("invalid_password", "Your password is incorrect.", 400);
  }
  const admin = createAdminClient();
  const { error } = await admin.from("users").update({ twofa_enabled: enabled }).eq("id", user.id);
  if (error) throw new DbError("update_failed", error.message, 500);
  await admin.from("notifications").insert({
    user_id: user.id,
    title: enabled ? "Two-factor authentication enabled" : "Two-factor authentication disabled",
    body: enabled
      ? "You'll now be asked for a one-time code sent to your email at every sign-in."
      : "Two-factor authentication is now off for your account.",
    link: "/settings/security",
  });
  return { ok: true, twofa_enabled: enabled };
}

/** Admin: send a test message with the currently saved email settings. */
async function sendTestEmail(input: { to?: string }) {
  await requireAdmin();
  const to = String(input.to ?? "").trim();
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    throw new DbError("invalid_email", "Enter a valid recipient email address.");
  }
  const cfg = await loadEmailConfig();
  if (!isEmailConfigured(cfg)) {
    throw new DbError("email_not_configured", "Save your email settings (host/key and from address) first.");
  }
  const result = await sendMail(cfg, { ...testEmail(await siteNameForEmail()), to });
  if (!result.sent) {
    throw new DbError("send_failed", result.error ?? "The test email could not be sent.", 400);
  }
  return { ok: true };
}

async function getAuditLogs(limit = 100) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { logs: (data ?? []) as AuditLogRow[] };
}

/* ------------------------------------------------------------------------- */
/* Admin: KYC / verifications                                                */
/* ------------------------------------------------------------------------- */

async function adminKyc(status?: string) {
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin
    .from("settings")
    .select("user_id, security, users!inner(email, first_name, last_name, kyc_status, created_at)")
    .neq("users.kyc_status", "not_submitted")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("users.kyc_status", status);
  const { data } = await query;
  return {
    submissions: ((data ?? []) as Record<string, unknown>[]).map((row) => {
      const u = row.users as Record<string, unknown> | null;
      const security = (row.security ?? {}) as { kyc?: Record<string, unknown> };
      return {
        user_id: row.user_id,
        email: u?.email,
        first_name: u?.first_name,
        last_name: u?.last_name,
        kyc_status: u?.kyc_status,
        created_at: u?.created_at,
        kyc: security.kyc && typeof security.kyc === "object" ? security.kyc : {},
      };
    }),
  };
}

async function adminVerifications() {
  await requireAdmin();
  const admin = createAdminClient();
  const [unverified, pendingKyc] = await Promise.all([
    admin
      .from("users")
      .select("id, email, created_at, email_verified_at")
      .is("email_verified_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("users")
      .select("id, email, created_at, kyc_status, email_verified_at")
      .in("kyc_status", ["in_review", "rejected"])
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  return {
    unverified_emails: unverified.data ?? [],
    kyc_review: pendingKyc.data ?? [],
  };
}

/* ------------------------------------------------------------------------- */
/* Admin: transfers                                                          */
/* ------------------------------------------------------------------------- */

async function adminTransfers(search?: string, status?: string) {
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin
    .from("transactions")
    .select("*, users(email)")
    .in("kind", ["transfer"])
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  if (search) {
    const term = `%${search.trim()}%`;
    query = query.or(`name.ilike.${term},reference.ilike.${term},users.email.ilike.${term}`);
  }
  const { data } = await query;
  return {
    transfers: ((data ?? []) as Record<string, unknown>[]).map((row) => {
      const rel = row.users as { email?: string } | null;
      const { users: _users, ...rest } = row;
      return { ...rest, email: rel?.email };
    }),
  };
}

async function setTransferStatus(input: { id?: string; status?: string }) {
  await requireAdmin();
  if (!input.id || !input.status) throw new DbError("invalid_request", "Missing id or status.");
  if (!["pending", "completed", "failed", "cancelled"].includes(input.status)) {
    throw new DbError("invalid_status", "Unsupported status.");
  }
  const admin = createAdminClient();
  const { data: rows } = await admin.from("transactions").select("*").eq("id", input.id).limit(1);
  const tx = firstRow(rows) as (TransactionRow & {
    hold_settled_at?: string | null;
    hold_released_at?: string | null;
  }) | null;
  if (!tx) throw new DbError("not_found", "Transfer not found.", 404);

  const { error } = await admin.from("transactions").update({ status: input.status }).eq("id", input.id);
  if (error) throw new DbError("update_failed", error.message, 500);

  // Money only moves for the sender's (debit) side, and only once — the
  // hold timestamps guarantee no double settle / double refund.
  const now = new Date().toISOString();
  const total = round2(Number(tx.amount) + Number(tx.fee ?? 0));
  if (tx.direction === "debit" && !tx.hold_settled_at && !tx.hold_released_at) {
    if (input.status === "completed") {
      const { data: claimed } = await admin
        .from("transactions")
        .update({ hold_settled_at: now })
        .eq("id", tx.id)
        .is("hold_settled_at", null)
        .is("hold_released_at", null)
        .select("id");
      if (claimed && claimed.length > 0) {
        await admin.rpc("settle_hold", {
          p_user_id: tx.user_id,
          p_amount: total,
          p_currency: tx.currency,
        });
        // Release the matching pending credit to the recipient, once.
        const { data: counterparts } = await admin
          .from("transactions")
          .select("id, user_id, amount, currency")
          .eq("reference", tx.reference)
          .eq("kind", tx.kind)
          .eq("direction", "credit")
          .eq("status", "pending")
          .neq("id", tx.id)
          .limit(1);
        const counter = firstRow(counterparts) as
          | { id: string; user_id: string; amount: string | number; currency: string }
          | null;
        if (counter) {
          const { data: claimedCredit } = await admin
            .from("transactions")
            .update({ status: "completed" })
            .eq("id", counter.id)
            .eq("status", "pending")
            .select("id");
          if (claimedCredit && claimedCredit.length > 0) {
            await admin.rpc("credit_account", {
              p_user_id: counter.user_id,
              p_amount: Number(counter.amount),
              p_currency: counter.currency,
            });
          }
        }
      }
    } else if (input.status === "failed" || input.status === "cancelled") {
      const { data: claimed } = await admin
        .from("transactions")
        .update({ hold_released_at: now })
        .eq("id", tx.id)
        .is("hold_settled_at", null)
        .is("hold_released_at", null)
        .select("id");
      if (claimed && claimed.length > 0) {
        await admin.rpc("release_hold", {
          p_user_id: tx.user_id,
          p_amount: total,
          p_currency: tx.currency,
        });
        // Drop the recipient's matching pending credit.
        await admin
          .from("transactions")
          .update({ status: input.status })
          .eq("reference", tx.reference)
          .eq("kind", tx.kind)
          .eq("direction", "credit")
          .eq("status", "pending")
          .neq("id", tx.id);
      }
    }
  }

  await writeAudit({ action: `transfer.${input.status}`, target_type: "transaction", target_id: input.id });
  return { ok: true };
}


/* ------------------------------------------------------------------------- */
/* Admin: referrals                                                          */
/* ------------------------------------------------------------------------- */

async function adminReferrals() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id, email, first_name, last_name, referral_code, created_at")
    .not("referral_code", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);
  const referees = (data ?? []) as {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    referral_code: string;
    created_at: string;
  }[];
  // Group sign-ups by the invite code they used.
  const usage = new Map<string, number>();
  for (const r of referees) {
    usage.set(r.referral_code, (usage.get(r.referral_code) ?? 0) + 1);
  }
  return {
    referrals: referees.map((r) => ({
      id: r.id,
      email: r.email,
      name: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.email,
      code_used: r.referral_code,
      joined_at: r.created_at,
      total_for_code: usage.get(r.referral_code) ?? 1,
    })),
  };
}

/* ------------------------------------------------------------------------- */
/* Admin: bulk user import                                                   */
/* ------------------------------------------------------------------------- */

async function adminImportUsers(input: { rows?: { email?: string; first_name?: string; last_name?: string; password?: string }[] }) {
  await requireAdmin();
  const rows = input.rows ?? [];
  if (rows.length === 0) throw new DbError("invalid_input", "No rows to import.");
  if (rows.length > 100) throw new DbError("invalid_input", "Import at most 100 users at a time.");
  const admin = createAdminClient();
  const created: string[] = [];
  const errors: { email?: string; error: string }[] = [];
  for (const row of rows) {
    const email = row.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ email, error: "Invalid email." });
      continue;
    }
    const password = row.password && row.password.length >= 8 ? row.password : generateNumericCode() + "Aa";
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: row.first_name?.trim() || email.split("@")[0],
        last_name: row.last_name?.trim() || "",
        account_number: generateAccountNumber(),
      },
    });
    if (error) {
      errors.push({ email, error: error.message });
      continue;
    }
    created.push(email);
    void data;
  }
  await writeAudit({
    action: "users.import",
    target_type: "user",
    details: { created: created.length, failed: errors.length },
  });
  return { created, errors, passwords: Object.fromEntries(created.map((e, i) => [e, rows[i]?.password ?? null])) };
}

/* ------------------------------------------------------------------------- */
/* Admin: leads / tasks CRUD                                                 */
/* ------------------------------------------------------------------------- */

async function adminLeads(search?: string, status?: string) {
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin.from("leads").select("*").order("created_at", { ascending: false }).limit(200);
  if (status) query = query.eq("status", status);
  if (search) {
    const term = `%${search.trim()}%`;
    query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
  }
  const { data } = await query;
  return { leads: (data ?? []) as LeadRow[] };
}

async function saveLead(input: Partial<LeadRow>) {
  await requireAdmin();
  if (!input.name || !input.name.trim()) throw new DbError("invalid_name", "Lead name is required.");
  const admin = createAdminClient();
  if (input.id) {
    const { data, error } = await admin
      .from("leads")
      .update({
        name: input.name.trim(),
        email: input.email ?? null,
        phone: input.phone ?? null,
        source: input.source ?? "manual",
        status: input.status ?? "new",
        notes: input.notes ?? null,
      })
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw new DbError("update_failed", error.message, 500);
    await writeAudit({ action: "lead.update", target_type: "lead", target_id: String(input.id), details: { name: input.name } });
    return { lead: data };
  }
  const { data, error } = await admin
    .from("leads")
    .insert({
      name: input.name.trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      source: input.source ?? "manual",
      status: input.status ?? "new",
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw new DbError("create_failed", error.message, 500);
  await writeAudit({ action: "lead.create", target_type: "lead", target_id: (data as LeadRow).id, details: { name: input.name } });
  return { lead: data };
}

async function deleteLead(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing lead id.");
  const { error } = await createAdminClient().from("leads").delete().eq("id", id);
  if (error) throw new DbError("delete_failed", error.message, 500);
  await writeAudit({ action: "lead.delete", target_type: "lead", target_id: id });
  return { ok: true };
}

async function adminTasks(status?: string) {
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin.from("admin_tasks").select("*").order("created_at", { ascending: false }).limit(200);
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return { tasks: (data ?? []) as AdminTaskRow[] };
}

async function saveTask(input: Partial<AdminTaskRow>) {
  await requireAdmin();
  if (!input.title || !input.title.trim()) throw new DbError("invalid_input", "Task title is required.");
  const admin = createAdminClient();
  const patch = {
    title: input.title.trim(),
    description: input.description ?? null,
    assignee: input.assignee ?? null,
    priority: input.priority ?? "medium",
    status: input.status ?? "pending",
    due_at: input.due_at ?? null,
  };
  if (input.id) {
    const { data, error } = await admin.from("admin_tasks").update(patch).eq("id", input.id).select().single();
    if (error) throw new DbError("update_failed", error.message, 500);
    await writeAudit({ action: "task.update", target_type: "task", target_id: String(input.id), details: { title: patch.title } });
    return { task: data };
  }
  const { data, error } = await admin.from("admin_tasks").insert(patch).select().single();
  if (error) throw new DbError("create_failed", error.message, 500);
  await writeAudit({ action: "task.create", target_type: "task", target_id: (data as AdminTaskRow).id, details: { title: patch.title } });
  return { task: data };
}

async function deleteTask(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing task id.");
  const { error } = await createAdminClient().from("admin_tasks").delete().eq("id", id);
  if (error) throw new DbError("delete_failed", error.message, 500);
  await writeAudit({ action: "task.delete", target_type: "task", target_id: id });
  return { ok: true };
}

/* ------------------------------------------------------------------------- */
/* Admin: currencies / IRS / memberships                                     */
/* ------------------------------------------------------------------------- */

async function adminCurrencies() {
  await requireAdmin();
  const { data } = await createAdminClient()
    .from("site_currencies")
    .select("*")
    .order("code", { ascending: true });
  return { currencies: (data ?? []) as SiteCurrencyRow[] };
}

async function saveCurrency(input: Partial<SiteCurrencyRow>) {
  await requireAdmin();
  if (!input.code || !input.name) throw new DbError("invalid_input", "Currency code and name are required.");
  const admin = createAdminClient();
  const patch = {
    code: input.code.toUpperCase(),
    name: input.name,
    symbol: input.symbol || "$",
    rate: Number(input.rate ?? 1),
    enabled: input.enabled ?? true,
  };
  const { data, error } = await admin
    .from("site_currencies")
    .upsert(patch, { onConflict: "code" })
    .select()
    .single();
  if (error) throw new DbError("save_failed", error.message, 500);
  await writeAudit({ action: "currency.save", target_type: "currency", target_id: patch.code, details: patch });
  return { currency: data };
}

async function deleteCurrency(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing currency id.");
  const { error } = await createAdminClient().from("site_currencies").delete().eq("id", id);
  if (error) throw new DbError("delete_failed", error.message, 500);
  await writeAudit({ action: "currency.delete", target_type: "currency", target_id: id });
  return { ok: true };
}

async function adminIrsRefunds(search?: string, status?: string): Promise<{ refunds: (IrsRefundRow & { email?: string })[] }> {
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin
    .from("irs_refunds")
    .select("*, users(email)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("users.email", `%${search.trim()}%`);
  const { data } = await query;
  return {
    refunds: ((data ?? []) as Record<string, unknown>[]).map((row) => {
      const rel = row.users as { email?: string } | null;
      const { users: _users, ...rest } = row;
      return { ...(rest as unknown as IrsRefundRow), email: rel?.email };
    }),
  };
}

async function saveIrsRefund(input: { id?: string; user_id?: string; tax_year?: number; amount?: number; status?: string; notes?: string }) {
  await requireAdmin();
  const admin = createAdminClient();
  let userId = input.user_id;
  if (input.id && !userId) {
    const { data: existingRow } = await admin.from("irs_refunds").select("user_id").eq("id", input.id).single();
    userId = (existingRow as { user_id?: string } | null)?.user_id;
  }
  if (!userId) throw new DbError("invalid_input", "Select a user for the refund.");
  const patch = {
    user_id: userId,
    tax_year: parseAmountInput(input.tax_year ?? {}) ?? 2025,
    amount: parseAmountInput(input.amount ?? {}) ?? 0,
    status: input.status ?? "pending",
    notes: input.notes ?? null,
  };
  if (input.id) {
    const { data, error } = await admin.from("irs_refunds").update(patch).eq("id", input.id).select().single();
    if (error) throw new DbError("update_failed", error.message, 500);
    await writeAudit({ action: "irs.update", target_type: "irs_refund", target_id: String(input.id), details: patch });
    return { refund: data };
  }
  const { data, error } = await admin.from("irs_refunds").insert(patch).select().single();
  if (error) throw new DbError("create_failed", error.message, 500);
  await writeAudit({ action: "irs.create", target_type: "irs_refund", target_id: (data as IrsRefundRow).id, details: patch });
  return { refund: data };
}

async function deleteIrsRefund(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing refund id.");
  const { error } = await createAdminClient().from("irs_refunds").delete().eq("id", id);
  if (error) throw new DbError("delete_failed", error.message, 500);
  await writeAudit({ action: "irs.delete", target_type: "irs_refund", target_id: id });
  return { ok: true };
}

async function adminMemberships(search?: string, status?: string): Promise<{ memberships: (MembershipRow & { email?: string })[] }> {
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin
    .from("memberships")
    .select("*, users(email)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("users.email", `%${search.trim()}%`);
  const { data } = await query;
  return {
    memberships: ((data ?? []) as Record<string, unknown>[]).map((row) => {
      const rel = row.users as { email?: string } | null;
      const { users: _users, ...rest } = row;
      return { ...(rest as unknown as MembershipRow), email: rel?.email };
    }),
  };
}

async function saveMembership(input: { id?: string; user_id?: string; tier?: string; status?: string; ends_at?: string | null }) {
  await requireAdmin();
  const admin = createAdminClient();
  let userId = input.user_id;
  if (input.id && !userId) {
    const { data: existingRow } = await admin.from("memberships").select("user_id").eq("id", input.id).single();
    userId = (existingRow as { user_id?: string } | null)?.user_id;
  }
  if (!userId) throw new DbError("invalid_input", "Select a user for the membership.");
  const patch = {
    user_id: userId,
    tier: input.tier ?? "standard",
    status: input.status ?? "active",
    starts_at: input.id ? undefined : new Date().toISOString(),
    ends_at: input.ends_at ?? null,
  };
  if (patch.starts_at === undefined) delete (patch as { starts_at?: string }).starts_at;
  if (input.id) {
    const { data, error } = await admin.from("memberships").update(patch).eq("id", input.id).select().single();
    if (error) throw new DbError("update_failed", error.message, 500);
    await writeAudit({ action: "membership.update", target_type: "membership", target_id: String(input.id), details: patch });
    return { membership: data };
  }
  const { data, error } = await admin.from("memberships").insert(patch).select().single();
  if (error) throw new DbError("create_failed", error.message, 500);
  await writeAudit({ action: "membership.create", target_type: "membership", target_id: (data as MembershipRow).id, details: patch });
  return { membership: data };
}

async function deleteMembership(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing membership id.");
  const { error } = await createAdminClient().from("memberships").delete().eq("id", id);
  if (error) throw new DbError("delete_failed", error.message, 500);
  await writeAudit({ action: "membership.delete", target_type: "membership", target_id: id });
  return { ok: true };
}

/* ------------------------------------------------------------------------- */
/* Admin: support tickets + contact inbox                                    */
/* ------------------------------------------------------------------------- */

async function adminTickets(status?: string) {
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin
    .from("support_tickets")
    .select("*, users(email)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data } = await query;
  const rows = (data ?? []) as Record<string, unknown>[];
  const ids = rows.map((r) => String(r.id));
  let messages: SupportMessageRow[] = [];
  if (ids.length > 0) {
    const res = await admin.from("support_messages").select("*").in("ticket_id", ids);
    messages = (res.data ?? []) as SupportMessageRow[];
  }
  return {
    tickets: rows.map((row) => {
      const rel = row.users as { email?: string } | null;
      const mine = messages
        .filter((m) => m.ticket_id === row.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return {
        id: row.id,
        subject: row.subject,
        category: row.category,
        status: row.status,
        created_at: row.created_at,
        email: rel?.email,
        message_count: mine.length,
        last_message: mine[0]?.body ?? null,
        last_message_at: mine[0]?.created_at ?? row.created_at,
      };
    }),
  };
}

async function adminTicketDetail(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing ticket id.");
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("support_tickets")
    .select("*, users(email, first_name, last_name)")
    .eq("id", id)
    .limit(1);
  const ticket = firstRow(rows) as (Record<string, unknown> & { users?: { email?: string; first_name?: string; last_name?: string } }) | null;
  if (!ticket) throw new DbError("not_found", "Ticket not found.", 404);
  const { data: msgRows } = await admin
    .from("support_messages")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });
  const { users: ticketUser, ...rest } = ticket;
  return {
    ticket: { ...rest, email: ticketUser?.email },
    messages: ((msgRows ?? []) as SupportMessageRow[]).map((m) => ({
      id: m.id,
      body: m.body,
      from: m.sender,
      sender: m.sender === "support" ? "admin" : "user",
      created_at: m.created_at,
    })),
  };
}

async function adminReplyTicket(id?: string, body?: string) {
  const admin0 = createAdminClient();
  await requireAdmin();
  if (!id || !body?.trim()) throw new DbError("invalid_input", "Message body is required.");
  await admin0.from("support_messages").insert({
    ticket_id: id,
    sender: "support",
    body: body.trim(),
  });
  await writeAudit({ action: "ticket.reply", target_type: "ticket", target_id: id });
  return { ok: true };
}

async function setTicketStatus(input: { id?: string; status?: string }) {
  await requireAdmin();
  if (!input.id || !input.status) throw new DbError("invalid_request", "Missing ticket id or status.");
  if (!["open", "pending", "closed"].includes(input.status)) {
    throw new DbError("invalid_status", "Unsupported status.");
  }
  const { error } = await createAdminClient()
    .from("support_tickets")
    .update({ status: input.status })
    .eq("id", input.id);
  if (error) throw new DbError("update_failed", error.message, 500);
  await writeAudit({ action: `ticket.${input.status}`, target_type: "ticket", target_id: input.id });
  return { ok: true };
}

async function deleteTicket(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing ticket id.");
  const { error } = await createAdminClient().from("support_tickets").delete().eq("id", id);
  if (error) throw new DbError("delete_failed", error.message, 500);
  await writeAudit({ action: "ticket.delete", target_type: "ticket", target_id: id });
  return { ok: true };
}

async function adminContactMessages(handled?: string) {
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
  if (handled === "true") query = query.eq("handled", true);
  if (handled === "false") query = query.eq("handled", false);
  const { data } = await query;
  return { messages: (data ?? []) as ContactMessageRow[] };
}

async function setContactHandled(id?: string, handled?: boolean) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing message id.");
  const { error } = await createAdminClient()
    .from("contact_messages")
    .update({ handled: handled ?? true })
    .eq("id", id);
  if (error) throw new DbError("update_failed", error.message, 500);
  await writeAudit({ action: "contact.handled", target_type: "contact_message", target_id: id, details: { handled: handled ?? true } });
  return { ok: true };
}

/* ------------------------------------------------------------------------- */
/* Admin: site settings (general / contact / live chat / features)           */
/* ------------------------------------------------------------------------- */

interface SiteSettingsGroups {
  contact: Record<string, unknown>;
  live_chat: Record<string, unknown>;
  security: Record<string, unknown>;
  features: Record<string, unknown>;
  email: Record<string, unknown>;
}

async function readConfigGroups(admin: ReturnType<typeof createAdminClient>): Promise<SiteSettingsGroups> {
  const { data } = await admin.from("admin_config").select("key, value");
  const map = new Map<string, unknown>();
  for (const row of (data ?? []) as { key: string; value: unknown }[]) {
    map.set(row.key, row.value);
  }
  return {
    contact: (map.get("contact") as Record<string, unknown>) ?? {},
    live_chat: {
      enabled: false,
      position: "bottom-right",
      offset_bottom: 96,
      welcome_message: "Hi! How can we help you today?",
      title: "Live support",
      dashboard_only: true,
      ...((map.get("live_chat") as Record<string, unknown>) ?? {}),
    },
    security: (map.get("security") as Record<string, unknown>) ?? {},
    features: (map.get("features") as Record<string, unknown>) ?? {},
    email: (() => {
      const raw = { ...((map.get("email") as Record<string, unknown>) ?? {}) };
      // Never return stored credentials to the browser.
      if (raw.smtp_password) raw.smtp_password = "********";
      if (raw.api_key) raw.api_key = "********";
      return raw;
    })(),
  };
}

async function getSiteSettings() {
  await requireAdmin();
  const admin = createAdminClient();
  const [site, groups] = await Promise.all([resolveSite(undefined), readConfigGroups(admin)]);
  return { site, ...groups };
}

async function updateSiteSettings(input: { group?: string; value?: Record<string, unknown> }) {
  await requireAdmin();
  if (!input.group || typeof input.value !== "object" || input.value === null) {
    throw new DbError("invalid_input", "Missing settings group or value.");
  }
  const admin = createAdminClient();

  if (input.group === "general") {
    // Site identity lives on the sites table.
    const patch: Record<string, unknown> = {};
    if (typeof input.value.name === "string" && input.value.name.trim()) patch.name = input.value.name.trim();
    if (typeof input.value.brand_color === "string" && input.value.brand_color.trim()) patch.brand_color = input.value.brand_color.trim();
    if ("logo_url" in input.value) patch.logo_url = input.value.logo_url || null;
    if (Object.keys(patch).length === 0) throw new DbError("invalid_input", "Nothing to update.");
    const current = await resolveSite(undefined);
    const { error } = await admin.from("sites").update(patch).eq("id", current.id);
    if (error) throw new DbError("update_failed", error.message, 500);
  } else if (["contact", "live_chat", "security", "features", "email"].includes(input.group)) {
    if (input.group === "email") {
      const { data: existing } = await admin
        .from("admin_config")
        .select("value")
        .eq("key", "email")
        .maybeSingle();
      const prev = ((existing as { value?: Record<string, unknown> } | null)?.value ?? {}) as Record<string, unknown>;
      for (const field of ["smtp_password", "api_key"]) {
        if (!input.value[field] || input.value[field] === "********") input.value[field] = prev[field] ?? "";
      }
    }
    await admin
      .from("admin_config")
      .upsert({ key: input.group, value: input.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  } else {
    throw new DbError("invalid_group", "Unknown settings group.");
  }

  await writeAudit({ action: "settings.update", target_type: "settings", target_id: input.group, details: input.value });
  return { ok: true };
}

/** Public subset of site settings used by the user-facing website. */
async function publicSiteSettings() {
  const admin = createAdminClient();
  const [site, groups] = await Promise.all([resolveSite(undefined), readConfigGroups(admin)]);
  const chat = groups.live_chat;
  return {
    name: site.name,
    brand_color: site.brand_color,
    logo_url: site.logo_url,
    contact: groups.contact,
    live_chat: {
      enabled: Boolean(chat.enabled),
      position: String(chat.position ?? "bottom-right"),
      offset_bottom: Number(chat.offset_bottom ?? 96),
      welcome_message: String(chat.welcome_message ?? "Hi! How can we help you today?"),
      title: String(chat.title ?? "Live support"),
      dashboard_only: chat.dashboard_only !== false,
    },
    features: groups.features,
  };
}

/** Public, published FAQs for the website FAQ page. */
async function publicFaqs() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("faqs")
    .select("id, question, answer")
    .eq("enabled", true)
    .order("sort_order", { ascending: true });
  return { faqs: (data ?? []) as { id: string; question: string; answer: string }[] };
}

/* ------------------------------------------------------------------------- */
/* Admin: FAQ + testimonials content                                         */
/* ------------------------------------------------------------------------- */

async function adminFaqs() {
  await requireAdmin();
  const { data } = await createAdminClient()
    .from("faqs")
    .select("*")
    .order("sort_order", { ascending: true });
  return { faqs: (data ?? []) as FaqRow[] };
}

async function saveFaq(input: Partial<FaqRow>) {
  await requireAdmin();
  if (!input.question?.trim() || !input.answer?.trim()) {
    throw new DbError("invalid_input", "Question and answer are required.");
  }
  const admin = createAdminClient();
  const patch = {
    question: input.question.trim(),
    answer: input.answer.trim(),
    sort_order: typeof input.sort_order === "number" ? input.sort_order : 100,
    enabled: input.enabled ?? true,
  };
  if (input.id) {
    const { data, error } = await admin.from("faqs").update(patch).eq("id", input.id).select().single();
    if (error) throw new DbError("update_failed", error.message, 500);
    await writeAudit({ action: "faq.update", target_type: "faq", target_id: String(input.id) });
    return { faq: data };
  }
  const { data, error } = await admin.from("faqs").insert(patch).select().single();
  if (error) throw new DbError("create_failed", error.message, 500);
  await writeAudit({ action: "faq.create", target_type: "faq", target_id: (data as FaqRow).id });
  return { faq: data };
}

async function deleteFaq(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing FAQ id.");
  const { error } = await createAdminClient().from("faqs").delete().eq("id", id);
  if (error) throw new DbError("delete_failed", error.message, 500);
  await writeAudit({ action: "faq.delete", target_type: "faq", target_id: id });
  return { ok: true };
}

async function adminTestimonials() {
  await requireAdmin();
  const { data } = await createAdminClient()
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });
  return { testimonials: (data ?? []) as TestimonialRow[] };
}

async function saveTestimonial(input: Partial<TestimonialRow>) {
  await requireAdmin();
  if (!input.author?.trim() || !input.quote?.trim()) {
    throw new DbError("invalid_input", "Author and quote are required.");
  }
  const admin = createAdminClient();
  const rating = Math.min(5, Math.max(1, Number(input.rating ?? 5)));
  const patch = {
    author: input.author.trim(),
    role: input.role?.trim() || null,
    quote: input.quote.trim(),
    rating,
    enabled: input.enabled ?? true,
  };
  if (input.id) {
    const { data, error } = await admin.from("testimonials").update(patch).eq("id", input.id).select().single();
    if (error) throw new DbError("update_failed", error.message, 500);
    await writeAudit({ action: "testimonial.update", target_type: "testimonial", target_id: String(input.id) });
    return { testimonial: data };
  }
  const { data, error } = await admin.from("testimonials").insert(patch).select().single();
  if (error) throw new DbError("create_failed", error.message, 500);
  await writeAudit({ action: "testimonial.create", target_type: "testimonial", target_id: (data as TestimonialRow).id });
  return { testimonial: data };
}

async function deleteTestimonial(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing testimonial id.");
  const { error } = await createAdminClient().from("testimonials").delete().eq("id", id);
  if (error) throw new DbError("delete_failed", error.message, 500);
  await writeAudit({ action: "testimonial.delete", target_type: "testimonial", target_id: id });
  return { ok: true };
}

/* ------------------------------------------------------------------------- */
/* Admin: broadcast / crypto assets / storage assets                          */
/* ------------------------------------------------------------------------- */

export type BroadcastSegment =
  | "all"
  | "active"
  | "inactive"
  | "email_verified"
  | "email_unverified"
  | "kyc_verified"
  | "kyc_in_review";

const BROADCAST_SEGMENTS: BroadcastSegment[] = [
  "all", "active", "inactive",
  "email_verified", "email_unverified",
  "kyc_verified", "kyc_in_review",
];

/**
 * Send an announcement to a selected audience.
 *
 * Audience is either an explicit list of member ids (one or many, chosen in
 * Admin → Broadcast) or a segment. Every recipient always gets the in-app
 * notification; when `send_email` is on they also receive the branded HTML
 * email at the exact address on their account.
 */
async function adminBroadcast(input: {
  title?: string;
  body?: string;
  link?: string;
  segment?: string;
  user_ids?: string[];
  send_email?: boolean;
}) {
  await requireAdmin();
  if (!input.title?.trim() || !input.body?.trim()) {
    throw new DbError("invalid_input", "Title and message are required.");
  }
  const ids = (input.user_ids ?? []).map((id) => String(id)).filter(Boolean);
  const segment = (BROADCAST_SEGMENTS.includes(input.segment as BroadcastSegment)
    ? input.segment
    : "all") as BroadcastSegment;

  const admin = createAdminClient();
  let query = admin.from("users").select("id, email, first_name, last_name");
  if (ids.length > 0) {
    query = query.in("id", ids);
  } else {
    switch (segment) {
      case "active":
        query = query.eq("status", "active");
        break;
      case "inactive":
        query = query.in("status", ["suspended", "disabled"]);
        break;
      case "email_verified":
        query = query.not("email_verified_at", "is", null).eq("status", "active");
        break;
      case "email_unverified":
        query = query.is("email_verified_at", null);
        break;
      case "kyc_verified":
        query = query.eq("kyc_status", "verified");
        break;
      case "kyc_in_review":
        query = query.eq("kyc_status", "in_review");
        break;
      case "all":
      default:
        break;
    }
  }

  const { data: users, error } = await query;
  if (error) throw new DbError("broadcast_failed", error.message, 500);
  const recipients = (users ?? []) as {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  }[];
  const audience = ids.length > 0 ? `${recipients.length} selected member(s)` : segment;
  if (recipients.length === 0) {
    return { ok: true, recipients: 0, emailed: 0, segment: audience };
  }

  const title = input.title.trim();
  const body = input.body.trim();
  const link = input.link?.trim() || null;

  const rows = recipients.map((u) => ({ user_id: u.id, title, body, link }));
  for (let i = 0; i < rows.length; i += 200) {
    const { error: insertError } = await admin
      .from("notifications")
      .insert(rows.slice(i, i + 200));
    if (insertError) throw new DbError("broadcast_failed", insertError.message, 500);
  }

  // Email delivery — one message per member, to the address on their account.
  let emailed = 0;
  if (input.send_email) {
    const siteName = await siteNameForEmail();
    for (const u of recipients) {
      if (!u.email) continue;
      const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || undefined;
      const sent = await deliver(
        u.email,
        broadcastEmail({ siteName, title, bodyHtml: body, link, name }),
      );
      if (sent) emailed += 1;
    }
  }

  await writeAudit({
    action: "broadcast.send",
    target_type: "notification",
    details: { title, recipients: recipients.length, emailed, audience },
  });
  return { ok: true, recipients: recipients.length, emailed, segment: audience };
}

/* ------------------------------------------------------------------------- */
/* Grant programs (admin-managed, shown on the public website)                */
/* ------------------------------------------------------------------------- */

export interface GrantProgramRow {
  id: string;
  title: string;
  description: string;
  icon: string;
  tint: string;
  bullets: string[];
  max_amount: string | number | null;
  sort_order: number;
  enabled: boolean;
}

function mapGrantProgram(row: Record<string, unknown>): GrantProgramRow {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    icon: String(row.icon ?? "fa-solid fa-hand-holding-dollar"),
    tint: String(row.tint ?? "blue"),
    bullets: Array.isArray(row.bullets) ? (row.bullets as unknown[]).map(String) : [],
    max_amount: (row.max_amount as string | number | null) ?? null,
    sort_order: Number(row.sort_order ?? 0),
    enabled: row.enabled !== false,
  };
}

/** Public: the grant programs the website should advertise right now. */
async function publicGrantPrograms() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("grant_programs")
    .select("*")
    .eq("enabled", true)
    .order("sort_order", { ascending: true });
  return { programs: ((data ?? []) as Record<string, unknown>[]).map(mapGrantProgram) };
}

async function adminGrantPrograms() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("grant_programs")
    .select("*")
    .order("sort_order", { ascending: true });
  return { programs: ((data ?? []) as Record<string, unknown>[]).map(mapGrantProgram) };
}

async function saveGrantProgram(input: {
  id?: string;
  title?: string;
  description?: string;
  icon?: string;
  tint?: string;
  bullets?: string[] | string;
  max_amount?: number | string | null;
  sort_order?: number | string;
  enabled?: boolean;
}) {
  await requireAdmin();
  const title = String(input.title ?? "").trim();
  if (!title) throw new DbError("invalid_input", "A program title is required.");
  const bullets = Array.isArray(input.bullets)
    ? input.bullets.map((b) => String(b).trim()).filter(Boolean)
    : String(input.bullets ?? "")
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean);
  const amount = parseAmountInput(input.max_amount ?? null);
  const patch = {
    title,
    description: String(input.description ?? "").trim(),
    icon: String(input.icon ?? "").trim() || "fa-solid fa-hand-holding-dollar",
    tint: String(input.tint ?? "blue").trim() || "blue",
    bullets,
    max_amount: amount != null && amount > 0 ? String(amount) : null,
    sort_order: Number(input.sort_order ?? 0) || 0,
    enabled: input.enabled !== false,
  };
  const admin = createAdminClient();
  if (input.id) {
    const { error } = await admin.from("grant_programs").update(patch).eq("id", input.id);
    if (error) throw new DbError("update_failed", error.message, 500);
  } else {
    const { error } = await admin.from("grant_programs").insert(patch);
    if (error) throw new DbError("create_failed", error.message, 500);
  }
  await writeAudit({
    action: input.id ? "grant_program.update" : "grant_program.create",
    target_type: "grant_program",
    target_id: input.id,
    target_label: title,
  });
  return { ok: true };
}

async function deleteGrantProgram(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing program id.");
  const admin = createAdminClient();
  const { error } = await admin.from("grant_programs").delete().eq("id", id);
  if (error) throw new DbError("delete_failed", error.message, 500);
  await writeAudit({ action: "grant_program.delete", target_type: "grant_program", target_id: id });
  return { ok: true };
}

async function adminCryptoAssets(search?: string): Promise<{
  assets: ({
    id: string;
    email?: string;
    full_name?: string;
    symbol: string;
    name: string;
    balance: string;
    price_usd: string | null;
  } & Record<string, unknown>)[];
}> {
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin
    .from("crypto_assets")
    .select("*, users(email, first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (search) {
    const term = `%${search.trim()}%`;
    query = query.or(`symbol.ilike.${term},users.email.ilike.${term}`);
  }
  const { data } = await query;
  return {
    assets: ((data ?? []) as Record<string, unknown>[]).map((row) => {
      const rel = row.users as
        | { email?: string; first_name?: string; last_name?: string }
        | null;
      const { users: _users, ...rest } = row;
      return {
        ...(rest as {
          id: string;
          symbol: string;
          name: string;
          balance: string;
          price_usd: string | null;
        }),
        email: rel?.email,
        full_name: `${rel?.first_name ?? ""} ${rel?.last_name ?? ""}`.trim() || undefined,
      };
    }),
  };
}

async function setCryptoAsset(input: { id?: string; balance?: number | string; price_usd?: number | string }) {
  await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing asset id.");
  const patch: Record<string, unknown> = {};
  const balance = parseAmountInput(input.balance);
  const price = parseAmountInput(input.price_usd);
  if (balance !== null && balance >= 0) patch.balance = String(balance);
  if (price !== null && price >= 0) patch.price_usd = String(price);
  if (Object.keys(patch).length === 0) throw new DbError("invalid_request", "Nothing to update.");
  const admin = createAdminClient();
  const { error } = await admin.from("crypto_assets").update(patch).eq("id", input.id);
  if (error) throw new DbError("update_failed", error.message, 500);
  await writeAudit({ action: "crypto_asset.update", target_type: "crypto_asset", target_id: input.id, details: patch });
  return { ok: true };
}

/** Browse the uploads storage bucket (grouped by owner folder). */
async function adminStorageAssets() {
  await requireAdmin();
  const admin = createAdminClient();
  const bucket = admin.storage.from("uploads");
  const { data: top, error } = await bucket.list("", { limit: 50, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw new DbError("list_failed", error.message, 500);
  const folders = (top ?? []).filter((f) => f.id === null);
  const files: { path: string; name: string; size: number; created_at: string | null; public_url: string }[] = [];
  for (const folder of folders.slice(0, 25)) {
    const { data: objs } = await bucket.list(folder.name, { limit: 20, sortBy: { column: "created_at", order: "desc" } });
    for (const o of objs ?? []) {
      const path = `${folder.name}/${o.name}`;
      files.push({
        path,
        name: o.name,
        size: o.metadata?.size ?? 0,
        created_at: (o.created_at as string | undefined) ?? null,
        public_url: bucket.getPublicUrl(path).data.publicUrl,
      });
    }
  }
  files.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  return { files: files.slice(0, 100), total_folders: folders.length };
}

async function deleteStorageAsset(path?: string) {
  await requireAdmin();
  if (!path || path.includes("..")) throw new DbError("invalid_request", "Invalid file path.");
  const admin = createAdminClient();
  const { error } = await admin.storage.from("uploads").remove([path]);
  if (error) throw new DbError("delete_failed", error.message, 500);
  await writeAudit({ action: "asset.delete", target_type: "storage", target_id: path });
  return { ok: true };
}

/**
 * Cancel a pending withdrawal the member never confirmed.
 * Releases the reserved money, marks the withdrawal + its history row
 * `cancelled`, and can never touch an already settled/released hold.
 */
async function cancelWithdrawal(input: { withdrawal_id: string }) {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("withdrawals")
    .select("*")
    .eq("id", String(input.withdrawal_id ?? ""))
    .eq("user_id", user.id)
    .eq("status", "pending")
    .limit(1);
  const w = firstRow(rows) as HoldWithdrawal | null;
  if (!w) throw new DbError("not_found", "That withdrawal can no longer be cancelled.", 404);

  const released = await releaseWithdrawalHold(w);
  if (!released) {
    throw new DbError("already_processed", "That withdrawal was already processed.");
  }
  await admin.from("withdrawals").update({ status: "cancelled" }).eq("id", w.id);
  await admin
    .from("transactions")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("kind", "withdrawal")
    .eq("status", "pending")
    .eq("reference", w.id);
  await admin.from("notifications").insert({
    user_id: user.id,
    title: "Withdrawal cancelled",
    body: `Your withdrawal of ${w.currency} ${Number(w.amount).toLocaleString()} was cancelled and the funds are available again.`,
    link: "/withdraw",
  });
  return { ok: true };
}

/**
 * Cancel a pending transfer that was never confirmed with its code.
 * Releases the reserved amount + fee and cancels both sides of the pair.
 */
async function cancelTransfer(input: { transfer_id: string }) {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("transactions")
    .select("*")
    .eq("id", String(input.transfer_id ?? ""))
    .eq("user_id", user.id)
    .eq("kind", "transfer")
    .eq("direction", "debit")
    .eq("status", "pending")
    .limit(1);
  const tx = firstRow(rows) as TransactionRow | null;
  if (!tx) throw new DbError("not_found", "That transfer can no longer be cancelled.", 404);

  const now = new Date().toISOString();
  // Claim the row first so a cancel and a confirm can never both move money.
  const { data: claimed } = await admin
    .from("transactions")
    .update({ status: "cancelled", hold_released_at: now })
    .eq("id", tx.id)
    .eq("status", "pending")
    .is("hold_settled_at", null)
    .is("hold_released_at", null)
    .select("id");
  if (!claimed || claimed.length === 0) {
    throw new DbError("already_processed", "That transfer was already processed.");
  }
  await admin.rpc("release_hold", {
    p_user_id: tx.user_id,
    p_amount: round2(Number(tx.amount) + Number(tx.fee ?? 0)),
    p_currency: tx.currency,
  });
  // Drop the matching pending credit row for member transfers.
  if (tx.reference) {
    await admin
      .from("transactions")
      .update({ status: "cancelled" })
      .eq("reference", tx.reference)
      .eq("kind", "transfer")
      .eq("direction", "credit")
      .eq("status", "pending");
  }
  await admin.from("notifications").insert({
    user_id: user.id,
    title: "Transfer cancelled",
    body: `Your transfer of ${tx.currency} ${Number(tx.amount).toLocaleString()} was cancelled and the funds are available again.`,
    link: "/transactions",
  });
  return { ok: true };
}

export const db = {
  cancelWithdrawal,
  cancelTransfer,
  siteInfo,
  me,
  balances,
  transactions,
  cards,
  beneficiaries,
  deposits,
  withdrawals,
  cryptoAssets,
  notifications,
  settings,
  loans,
  grants,
  irsRefunds,
  paymentMethods,
  transferConfig,
  getKyc,
  supportTickets,
  supportTicket,
  createTransfer,
  createDeposit,
  createWithdrawal,
  requestWithdrawal,
  verifyWithdrawal,
  createExternalTransfer,
  verifyTransfer,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  markNotificationsRead,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotifications,
  deleteNotification,
  updateSettings,
  updateProfile,
  submitKyc,
  setPin,
  verifyPin,
  uploadFile,
  submitContact,
  createSupportTicket,
  createSupportMessage,
  transactionsEmail,
  applyCard,
  applyLoan,
  applyGrant,
  loginMethod,
  register,
  login,
  login2fa,
  forgotPassword,
  resetPassword,
  logout,
  verifyEmail,
  resendVerifyCode,
  resendVerifyStatus,
  adminMe,
  adminOverview,
  adminUsers,
  adminTransactions,
  adminDeposits,
  setDepositStatus,
  adminWithdrawals,
  setWithdrawalStatus,
  adminCards,
  setCardStatus,
  setCardApplicationStatus,
  adminLoans,
  setLoanStatus,
  adminGrants,
  setGrantStatus,
  adminGrantPrograms,
  saveGrantProgram,
  deleteGrantProgram,
  publicGrantPrograms,
  adminSetUserStatus,
  adminUserDetail,
  adminUpdateUser,
  adminAdjustBalance,
  adminCreateTransaction,
  changePassword,
  securityStatus,
  setTwofa,
  sendTestEmail,
  adminDeleteUser,
  getAuditLogs,
  setAdminConfig,
  getAdminConfig,
  adminTogglePaymentMethod,
  adminPaymentMethods,
  adminKyc,
  adminVerifications,
  adminTransfers,
  setTransferStatus,
  adminReferrals,
  adminImportUsers,
  adminLeads,
  saveLead,
  deleteLead,
  adminTasks,
  saveTask,
  deleteTask,
  adminCurrencies,
  saveCurrency,
  deleteCurrency,
  adminIrsRefunds,
  saveIrsRefund,
  deleteIrsRefund,
  adminMemberships,
  saveMembership,
  deleteMembership,
  adminTickets,
  adminTicketDetail,
  adminReplyTicket,
  setTicketStatus,
  deleteTicket,
  adminContactMessages,
  setContactHandled,
  generateWithdrawalCode,
  savePaymentMethod,
  deletePaymentMethod,
  getSiteSettings,
  updateSiteSettings,
  publicSiteSettings,
  adminFaqs,
  publicFaqs,
  adminBroadcast,
  generateTransferCode,
  startImpersonation,
  endImpersonation,
  adminDeleteTransaction,
  adminCryptoAssets,
  setCryptoAsset,
  adminStorageAssets,
  deleteStorageAsset,
  saveFaq,
  deleteFaq,
  adminTestimonials,
  saveTestimonial,
  deleteTestimonial,
};