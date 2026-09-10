import { cookies } from "@/lib/next/headers";
import {
  hashPassword,
  verifyPassword,
  signImpersonationValue,
  verifyImpersonationValue,
  generateAccountNumber,
  generateNumericCode,
} from "@/lib/db/security";
import { DbError } from "@/lib/db/error";
import { parseAmountInput } from "@/lib/utils";
import type {
  Site,
  UserRow,
  TransactionRow,
  CardRow,
  BeneficiaryRow,
  NotificationRow,
  DepositRow,
  WithdrawalRow,
  CryptoAssetRow,
  LoanRow,
  GrantRow,
  CardApplicationRow,
  SettingsRow,
  PaymentMethod,
  SupportTicketRow,
  SupportMessageRow,
  KycRecord,
  AuditLogRow,
  LeadRow,
  AdminTaskRow,
  IrsRefundRow,
  MembershipRow,
  SiteCurrencyRow,
  FaqRow,
  TestimonialRow,
} from "@/lib/db/schema";

const SESSION_COOKIE = "sb_session_user";
const PENDING_VERIFY_COOKIE = "sb_pending_verify";

/* ------------------------------------------------------------------------- */
/* In-memory state                                                           */
/* ------------------------------------------------------------------------- */

function daysAgo(days: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const now = new Date().toISOString();

/* ------------------------------------------------------------------------- */
/* Static payment methods                                                    */
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
      { id: "bank_name", label: "Bank Name", type: "text", role: "display", value: "Tesla Model Bank, N.A." },
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

const state = {
  site: {
    id: 1,
    slug: "teslamodel",
    name: "Tesla Model",
    brand_color: "#0ea5e9",
    primary_currency: "USD",
    kyc_required: true,
  } satisfies Site,

  users: new Map<string, UserRow>([
    [
      "u-demo",
      {
        id: "u-demo",
        email: "alex.morgan@example.com",
        first_name: "Alex",
        last_name: "Morgan",
        full_name: "Alex Morgan",
        photo_url: "",
        phone: "+1 555 0100",
        country: "US",
        currency: "USD",
        role: "user",
        status: "active",
        kyc_status: "verified",
        kyc_required: true,
        email_verified_at: now,
        pin_gate: false,
        pin_hash: null,
        account_number: "4023391234",
        referral_code: "ALEXM",
        twofa_enabled: false,
        created_at: daysAgo(120),
      },
    ],
    [
      "u-admin",
      {
        id: "u-admin",
        email: "admin@teslamodel.xyz",
        first_name: "Admin",
        last_name: "User",
        full_name: "Admin User",
        photo_url: "",
        phone: null,
        country: "US",
        currency: "USD",
        role: "admin",
        status: "active",
        kyc_status: "verified",
        kyc_required: false,
        email_verified_at: now,
        pin_gate: false,
        pin_hash: null,
        account_number: "4000000001",
        referral_code: null,
        twofa_enabled: false,
        created_at: daysAgo(300),
      },
    ],
  ]),

  passwords: new Map<string, string>([
    ["alex.morgan@example.com", "password123"],
    ["admin@teslamodel.xyz", "admin123"],
  ]),

  adminCodes: new Map<string, string>([["u-admin", "scrypt:master"]]),

  accounts: [
    {
      id: "a-demo-usd",
      user_id: "u-demo",
      currency: "USD",
      balance: 84250.75,
      available: 84250.75,
      account_number: "4023391234",
      status: "active",
    },
  ] as Array<{
    id: string;
    user_id: string;
    currency: string;
    balance: number;
    available: number;
    account_number: string | null;
    status: string;
  }>,

  transactions: [] as TransactionRow[],
  cards: [] as CardRow[],
  beneficiaries: [] as BeneficiaryRow[],
  notifications: [] as NotificationRow[],
  deposits: [] as DepositRow[],
  withdrawals: [] as (WithdrawalRow & {
    confirmation_code?: string | null;
    confirmation_code_generated_at?: string | null;
    confirmation_code_expires_at?: string | null;
    confirmation_code_used_at?: string | null;
  })[],
  crypto: [] as CryptoAssetRow[],
  loans: [] as LoanRow[],
  grants: [] as GrantRow[],
  settings: new Map<string, SettingsRow>(),
  challenges: new Map<string, { user_id: string; code: string; expires_at: number }>(),
  resetCodes: new Map<string, { code: string; expires_at: number }>(),
  tickets: [] as SupportTicketRow[],
  ticketMessages: [] as SupportMessageRow[],
  contactMessages: [] as {
    id: string;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    handled: boolean;
    created_at: string;
  }[],
  leads: [] as LeadRow[],
  tasks: [] as AdminTaskRow[],
  config: new Map<string, unknown>(),
  irsRefunds: [] as (IrsRefundRow & { email?: string })[],
  memberships: [] as (MembershipRow & { email?: string })[],
  currencies: [] as SiteCurrencyRow[],
  paymentMethodsDb: [] as PaymentMethod[],
  faqs: [] as FaqRow[],
  testimonials: [] as TestimonialRow[],
  siteSettings: new Map<string, Record<string, unknown>>(),
  auditLogs: [] as AuditLogRow[],
};

function seed() {
  state.transactions = [
    {
      id: "tx-1",
      user_id: "u-demo",
      account_id: "a-demo-usd",
      kind: "deposit",
      direction: "credit",
      amount: "2500.00",
      currency: "USD",
      name: "Deposit",
      reference: null,
      status: "completed",
      fee: "0.00",
      balance_after: null,
      created_at: daysAgo(0, 6),
    },
    {
      id: "tx-2",
      user_id: "u-demo",
      account_id: "a-demo-usd",
      kind: "transfer",
      direction: "debit",
      amount: "1200.00",
      currency: "USD",
      name: "Transfer sent",
      reference: null,
      status: "completed",
      fee: "0.00",
      balance_after: null,
      created_at: daysAgo(1, 11),
    },
    {
      id: "tx-3",
      user_id: "u-demo",
      account_id: "a-demo-usd",
      kind: "card-spend",
      direction: "debit",
      amount: "87.45",
      currency: "USD",
      name: "Card spend",
      reference: null,
      status: "completed",
      fee: "0.00",
      balance_after: null,
      created_at: daysAgo(2, 8),
    },
    {
      id: "tx-4",
      user_id: "u-demo",
      account_id: "a-demo-usd",
      kind: "credited",
      direction: "credit",
      amount: "5000.00",
      currency: "USD",
      name: "Credited",
      reference: null,
      status: "completed",
      fee: "0.00",
      balance_after: null,
      created_at: daysAgo(3, 5),
    },
    {
      id: "tx-5",
      user_id: "u-demo",
      account_id: "a-demo-usd",
      kind: "plan-debit",
      direction: "credit",
      amount: "342.18",
      currency: "USD",
      name: "Plan ROI",
      reference: null,
      status: "completed",
      fee: "0.00",
      balance_after: null,
      created_at: daysAgo(4, 4),
    },
  ];

  state.cards = [
    {
      id: "c-1",
      user_id: "u-demo",
      brand: "visa",
      card_type: "credit",
      last4: "4128",
      holder: "Alex Morgan",
      expiry: "04/28",
      status: "active",
      limit_amount: "3200.00",
      spent: "0.00",
      frozen: false,
      created_at: daysAgo(60),
    },
    {
      id: "c-2",
      user_id: "u-demo",
      brand: "mastercard",
      card_type: "credit",
      last4: "7761",
      holder: "Alex Morgan",
      expiry: "10/27",
      status: "active",
      limit_amount: "540.25",
      spent: "0.00",
      frozen: false,
      created_at: daysAgo(30),
    },
  ];

  state.beneficiaries = ["Emma Wilson", "Daniel Park", "Sophia Chen", "Liam Garcia"].map(
    (name, i) => ({
      id: `b-${i + 1}`,
      user_id: "u-demo",
      name,
      bank: "Chase",
      bank_name: "Chase",
      account_number: generateAccountNumber(),
      routing: null,
      email: null,
      currency: "USD",
      nickname: null,
      kind: i % 3 === 0 ? "international" : "local",
      favorite: i < 2,
      used_count: i * 2,
      last_used_at: i > 0 ? daysAgo(i) : null,
      created_at: daysAgo(20 - i),
    }),
  );

  state.notifications = [
    {
      id: "n-1",
      user_id: "u-demo",
      title: "Deposit received",
      body: "$2,500.00 was credited to your account.",
      link: null,
      icon: null,
      read_at: null,
      created_at: daysAgo(0, 6),
    },
    {
      id: "n-2",
      user_id: "u-demo",
      title: "New card issued",
      body: "Your new Visa card is ready to use.",
      link: "/cards",
      icon: null,
      read_at: now,
      created_at: daysAgo(1, 12),
    },
    {
      id: "n-3",
      user_id: "u-demo",
      title: "Security update",
      body: "Two-factor authentication is recommended for your account.",
      link: "/settings",
      icon: null,
      read_at: null,
      created_at: daysAgo(2, 10),
    },
  ];

  state.deposits = [
    { id: "d-1", user_id: "u-demo", method: "bank_transfer", amount: "2500.00", currency: "USD", reference: "DEP-001", status: "completed", created_at: daysAgo(0, 6) },
    { id: "d-2", user_id: "u-demo", method: "card", amount: "800.00", currency: "USD", reference: "DEP-002", status: "processing", created_at: daysAgo(0, 7) },
  ];

  state.withdrawals = [
    { id: "w-1", user_id: "u-demo", method: "bank_transfer", amount: "900.00", currency: "USD", account_number: "4023391234", reference: "WDR-001", status: "pending", created_at: daysAgo(1, 18) },
  ];

  state.crypto = [
    { id: "cr-1", user_id: "u-demo", symbol: "BTC", name: "Bitcoin", balance: "0", price_usd: "61500", created_at: daysAgo(120) },
    { id: "cr-2", user_id: "u-demo", symbol: "ETH", name: "Ethereum", balance: "0", price_usd: "3400", created_at: daysAgo(120) },
  ];

  state.settings.set("u-demo", {
    user_id: "u-demo",
    language: "en",
    currency: "USD",
    notifications: {},
    security: {},
    updated_at: now,
  });
}
seed();

/* Seed a transaction PIN for the demo user (1234) so transfers/withdrawals
   can be exercised without first calling setPin. */
void (async () => {
  const { hash } = await hashPassword("1234");
  const user = state.users.get("u-demo");
  if (user && !user.pin_hash) {
    state.users.set("u-demo", { ...user, pin_hash: hash });
  }
})();

/* ------------------------------------------------------------------------- */
/* Helpers                                                                   */
/* ------------------------------------------------------------------------- */

async function requireSession(): Promise<UserRow> {
  const store = await cookies();

  // Admin impersonation cookie takes precedence (signed, httpOnly).
  const bimp = store.getAll().find((c) => c.name.startsWith("bimp_"));
  const impersonatedId = verifyImpersonationValue(bimp?.value);
  if (impersonatedId) {
    const user = state.users.get(impersonatedId);
    if (user) return user;
  }

  const id = store.get(SESSION_COOKIE)?.value;
  const user = id ? state.users.get(id) : undefined;
  if (!user) throw new DbError("unauthenticated", "Not signed in.", 401);
  return user;
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
    full_name: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
    created_at: row.created_at,
  };
}

function mapTransaction(tx: TransactionRow) {
  return {
    id: tx.id,
    kind: tx.kind,
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

function currencyAmount(userId: string) {
  const acc = state.accounts.find((a) => a.user_id === userId);
  return acc ? String(acc.balance) : "0";
}

function transferConfigDefaults() {
  return { transfer_charges: 1.5, min_transfer: 10, max_transfer: 25000 };
}

/** Pending member transfers waiting for the confirmation code before crediting the recipient. */
const pendingMemberCredits = new Map<
  string,
  { recipient_id: string; amount: number; currency: string; name: string }
>();

/** Confirmation codes issued for pending transfers (mock stand-in for the DB columns). */
const transferCodes = new Map<string, { code: string; expires_at: number; used_at: string | null }>();

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
/* Public / authenticated                                                    */
/* ------------------------------------------------------------------------- */

async function siteInfo(slug?: string) {
  return { site: state.site };
}

async function me(slug?: string) {
  const user = await requireSession();
  const store = await cookies();
  const impersonating = store.getAll().some((c) => c.name.startsWith("bimp_"));
  return { site: state.site, user: mapUser(user), impersonating };
}

async function balances() {
  const user = await requireSession();
  return {
    balances: state.accounts
      .filter((a) => a.user_id === user.id)
      .map((a) => ({
        currency: a.currency,
        amount: String(a.balance),
        available: String(a.balance),
        reserved: 0,
      })),
  };
}

async function cancelWithdrawal(input: { withdrawal_id: string }) {
  const user = await requireSession();
  const w = state.withdrawals.find(
    (row) => row.id === input.withdrawal_id && row.user_id === user.id && row.status === "pending",
  );
  if (!w) throw new DbError("not_found", "That withdrawal can no longer be cancelled.", 404);
  w.status = "cancelled";
  const acc = state.accounts.find((a) => a.user_id === user.id);
  if (acc) acc.balance = round2(acc.balance + Number(w.amount));
  const tx = state.transactions.find(
    (t) => t.user_id === user.id && t.reference === w.reference && t.status === "pending",
  );
  if (tx) tx.status = "cancelled";
  return { ok: true };
}

async function cancelTransfer(input: { transfer_id: string }) {
  const user = await requireSession();
  const tx = state.transactions.find(
    (t) =>
      t.id === input.transfer_id &&
      t.user_id === user.id &&
      t.kind === "transfer" &&
      t.status === "pending",
  );
  if (!tx) throw new DbError("not_found", "That transfer can no longer be cancelled.", 404);
  tx.status = "cancelled";
  const acc = state.accounts.find((a) => a.user_id === user.id);
  if (acc) acc.balance = round2(acc.balance + Number(tx.amount) + Number(tx.fee ?? 0));
  return { ok: true };
}

async function transactions(limit = 50) {
  const user = await requireSession();
  const rows = state.transactions
    .filter((t) => t.user_id === user.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
  return { transactions: rows.map(mapTransaction) };
}

async function cards() {
  const user = await requireSession();
  return { cards: state.cards.filter((c) => c.user_id === user.id).map(mapCard) };
}

async function beneficiaries() {
  const user = await requireSession();
  return {
    beneficiaries: state.beneficiaries
      .filter((b) => b.user_id === user.id)
      .map((b) => ({
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
  const user = await requireSession();
  return { deposits: state.deposits.filter((d) => d.user_id === user.id) };
}

async function withdrawals() {
  const user = await requireSession();
  return { withdrawals: state.withdrawals.filter((w) => w.user_id === user.id) };
}

async function cryptoAssets() {
  const user = await requireSession();
  return {
    assets: state.crypto
      .filter((c) => c.user_id === user.id)
      .map((c) => ({
        symbol: c.symbol,
        name: c.name,
        mock_rate_usd: Number(c.price_usd ?? 0),
        balance: c.balance,
      })),
  };
}

async function notifications() {
  const user = await requireSession();
  const rows = state.notifications
    .filter((n) => n.user_id === user.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
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
  const user = await requireSession();
  return { settings: state.settings.get(user.id) ?? null };
}

async function loans() {
  const user = await requireSession();
  return { loans: state.loans.filter((l) => l.user_id === user.id) };
}

async function grants() {
  const user = await requireSession();
  return { grants: state.grants.filter((g) => g.user_id === user.id) };
}

async function irsRefunds() {
  const user = await requireSession();
  return { refunds: state.irsRefunds.filter((r) => r.user_id === user.id) };
}




async function paymentMethods(forType: string) {
  await requireSession();
  await ensurePaymentMethodsSeededMock();
  const type: "deposit" | "withdrawal" = forType === "withdrawal" ? "withdrawal" : "deposit";
  return {
    methods: state.paymentMethodsDb
      .filter((m) => m.type === type && (m.enabled ?? true))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  };
}

async function transferConfig() {
  await requireSession();
  return transferConfigDefaults();
}

async function getKyc() {
  const user = await requireSession();
  const kyc = state.settings.get(user.id)?.security?.kyc;
  return { kyc: (kyc && typeof kyc === "object" ? kyc : {}) as Record<string, unknown> };
}

async function supportTickets() {
  const user = await requireSession();
  return {
    tickets: state.tickets
      .filter((t) => t.user_id === user.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((t) => {
        const messages = state.ticketMessages
          .filter((m) => m.ticket_id === t.id)
          .sort((a, b) => b.created_at.localeCompare(a.created_at));
        const last = messages[0];
        const unread = messages.filter(
          (m) => m.sender === "support" && !(m as SupportMessageRow & { read_at?: string }).read_at,
        ).length;
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
  const user = await requireSession();
  const ticket = state.tickets.find((t) => t.id === id && t.user_id === user.id);
  if (!ticket) throw new DbError("not_found", "Ticket not found.", 404);
  return {
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      last_message_at: ticket.created_at,
      unread_for_user: 0,
    },
    messages: state.ticketMessages
      .filter((m) => m.ticket_id === id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((m) => ({
        id: m.id,
        body: m.body,
        from: m.sender,
        sender: m.sender === "support" ? "admin" : "user",
        created_at: m.created_at,
      })),
  };
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
  | { transaction: ReturnType<typeof mapTransaction> }
> {
  const user = await requireSession();
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

  const acc = state.accounts.find((a) => a.user_id === user.id);
  if (!acc || Number(acc.balance) < input.amount) {
    throw new DbError("insufficient_funds", "Insufficient funds for this transfer.");
  }
  acc.balance = Number((acc.balance - input.amount).toFixed(2));
  const name =
    state.beneficiaries.find((b) => b.id === input.beneficiary_id)?.name ??
    input.name ??
    "Transfer sent";
  const tx: TransactionRow = {
    id: `tx-${Date.now()}`,
    user_id: user.id,
    account_id: acc.id,
    kind: "transfer",
    direction: "debit",
    amount: String(input.amount),
    currency: input.currency ?? "USD",
    name,
    reference: input.note ?? null,
    status: "completed",
    fee: "0.00",
    balance_after: String(acc.balance),
    created_at: new Date().toISOString(),
  };
  state.transactions.push(tx);
  return { transaction: mapTransaction(tx) };
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
  const recipient = [...state.users.values()].find((u) => u.email === email);
  if (!recipient) {
    throw new DbError("recipient_not_found", "No member found with that email.");
  }

  const acc = state.accounts.find((a) => a.user_id === user.id);
  const recipientAcc = state.accounts.find((a) => a.user_id === recipient.id);
  const fee = round2(input.amount * (cfg.transfer_charges / 100));
  const total = round2(input.amount + fee);
  if (!acc || Number(acc.balance) < total) {
    throw new DbError("insufficient_funds", "Insufficient funds for this transfer.");
  }

  acc.balance = round2(acc.balance - total);

  const transferId = `tf-${Date.now()}`;
  const ref = `TFR-${Date.now().toString(36).toUpperCase()}`;
  const created = new Date().toISOString();
  state.transactions.push({
    id: transferId,
    user_id: user.id,
    account_id: acc.id,
    kind: "transfer",
    direction: "debit",
    amount: String(input.amount),
    currency: input.currency ?? acc.currency,
    name: recipient.full_name,
    reference: ref,
    status: "pending",
    fee: String(fee),
    balance_after: String(acc.balance),
    created_at: created,
  });
  if (recipientAcc) {
    pendingMemberCredits.set(transferId, {
      recipient_id: recipient.id,
      amount: input.amount,
      currency: input.currency ?? recipientAcc.currency,
      name: user.full_name,
    });
  }
  const transferCode = generateNumericCode();
  transferCodes.set(transferId, {
    code: transferCode,
    expires_at: Date.now() + 60 * 60 * 1000,
    used_at: null,
  });
  return { fee, ref, transfer_id: transferId };
}

async function createDeposit(input: { amount: number; method: string; currency?: string }) {
  const user = await requireSession();
  if (!input.amount || input.amount <= 0) throw new DbError("invalid_amount", "Enter a valid amount.");
  const deposit: DepositRow = {
    id: `d-${Date.now()}`,
    user_id: user.id,
    method: input.method,
    amount: String(input.amount),
    currency: input.currency ?? "USD",
    reference: `DEP-${Date.now()}`,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  state.deposits.push(deposit);
  state.notifications.push({
    id: `n-${Date.now()}`,
    user_id: user.id,
    title: "Deposit received",
    body: `Your deposit of ${deposit.currency} ${input.amount.toLocaleString()} is pending verification.`,
    link: "/deposits",
    icon: null,
    read_at: null,
    created_at: new Date().toISOString(),
  });
  return { deposit };
}

async function createWithdrawal(input: {
  amount: number;
  method: string;
  account_number?: string;
  currency?: string;
}) {
  const user = await requireSession();
  if (!input.amount || input.amount <= 0) throw new DbError("invalid_amount", "Enter a valid amount.");
  const acc = state.accounts.find((a) => a.user_id === user.id);
  if (!acc || Number(acc.balance) < input.amount) {
    throw new DbError("insufficient_funds", "Insufficient funds for this withdrawal.");
  }
  acc.balance = Number((acc.balance - input.amount).toFixed(2));
  const withdrawal: WithdrawalRow = {
    id: `w-${Date.now()}`,
    user_id: user.id,
    method: input.method,
    amount: String(input.amount),
    currency: input.currency ?? "USD",
    account_number: input.account_number ?? null,
    reference: `WDR-${Date.now()}`,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  state.withdrawals.push(withdrawal);
  state.transactions.push({
    id: `tx-${Date.now()}`,
    user_id: user.id,
    account_id: acc.id,
    kind: "withdrawal",
    direction: "debit",
    amount: String(input.amount),
    currency: input.currency ?? "USD",
    name: "Withdrawal",
    reference: withdrawal.reference,
    status: "pending",
    fee: "0.00",
    balance_after: String(acc.balance),
    created_at: new Date().toISOString(),
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
  const user = await requireSession();
  if (!input.name) throw new DbError("invalid_name", "Beneficiary name is required.");
  const row: BeneficiaryRow = {
    id: `b-${Date.now()}`,
    user_id: user.id,
    name: input.name,
    bank: input.bank_name ?? input.bank ?? null,
    account_number: input.account_number ?? null,
    routing: input.routing_number ?? null,
    email: null,
    currency: "USD",
    nickname: null,
    kind: input.kind ?? (input.crypto_currency ? "crypto" : "local"),
    favorite: input.favorite ?? false,
    bank_name: input.bank_name ?? null,
    swift: input.swift ?? null,
    account_type: input.account_type ?? null,
    routing_number: input.routing_number ?? null,
    country: input.country ?? null,
    bank_address: input.bank_address ?? null,
    iban: input.iban ?? null,
    crypto_currency: input.crypto_currency ?? null,
    used_count: 0,
    last_used_at: null,
    created_at: new Date().toISOString(),
  };
  state.beneficiaries.push(row);
  return { beneficiary: row };
}

async function updateBeneficiary(id: string, patch: Partial<BeneficiaryRow>) {
  const user = await requireSession();
  const row = state.beneficiaries.find((b) => b.id === id && b.user_id === user.id);
  if (row) {
    Object.assign(row, patch);
    if (patch.bank_name != null) row.bank = patch.bank_name;
    if (patch.routing_number != null) row.routing = patch.routing_number;
  }
  return { ok: true };
}

async function deleteBeneficiary(id: string) {
  const user = await requireSession();
  state.beneficiaries = state.beneficiaries.filter((b) => !(b.id === id && b.user_id === user.id));
  return { ok: true };
}

async function requestWithdrawal(input: {
  amount: number;
  method_id?: string | number;
  custom?: Record<string, string>;
  destination?: Record<string, unknown> | string;
  pin?: string;
}) {
  const user = await requireSession();
  if (!input.amount || input.amount <= 0) {
    throw new DbError("invalid_amount", "Enter a valid amount.");
  }
  const acc = state.accounts.find((a) => a.user_id === user.id);
  const balance = acc ? Number(acc.balance) : 0;
  if (balance < input.amount) {
    throw new DbError("insufficient_balance", "Not enough balance for this withdrawal.");
  }
  await checkPin(user, input.pin);

    await ensurePaymentMethodsSeededMock();
  const method =
    input.method_id != null
      ? state.paymentMethodsDb.find((m) => m.id === String(input.method_id) && m.enabled !== false)
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

  if (acc) acc.balance = round2(acc.balance - input.amount);
  const withdrawal: WithdrawalRow = {
    id: `w-${Date.now()}`,
    user_id: user.id,
    method: method?.name ?? "bank_transfer",
    method_id: input.method_id != null ? String(input.method_id) : null,
    amount: String(input.amount),
    currency: acc?.currency ?? "USD",
    account_number: null,
    destination:
      typeof input.destination === "object" && input.destination != null
        ? input.destination
        : null,
    custom: input.custom ?? null,
    reference: `WDR-${Date.now()}`,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  state.withdrawals.push(withdrawal);
  if (acc) {
    state.transactions.push({
      id: `tx-${Date.now()}`,
      user_id: user.id,
      account_id: acc.id,
      kind: "withdrawal",
      direction: "debit",
      amount: String(input.amount),
      currency: acc.currency,
      name: "Withdrawal",
      reference: withdrawal.reference,
      status: "pending",
      fee: "0.00",
      balance_after: String(acc.balance),
      created_at: new Date().toISOString(),
    });
    state.notifications.push({
      id: `n-${Date.now()}`,
      user_id: user.id,
      title: "Withdrawal submitted",
      body: `A withdrawal of $${input.amount.toLocaleString()} is pending review.`,
      link: "/withdraw",
      icon: null,
      read_at: null,
      created_at: new Date().toISOString(),
    });
  }
  return { withdrawal_id: withdrawal.id };
}

async function verifyWithdrawal(input: { withdrawal_id: string; code: string }) {
  const user = await requireSession();
  const supplied = String(input.code ?? "").trim();
  const withdrawal = state.withdrawals.find(
    (w) =>
      w.id === input.withdrawal_id &&
      w.user_id === user.id &&
      w.confirmation_code &&
      w.confirmation_code === supplied &&
      !w.confirmation_code_used_at &&
      w.confirmation_code_expires_at &&
      new Date(w.confirmation_code_expires_at).getTime() > Date.now() &&
      w.status === "pending",
  ) as (WithdrawalRow & {
    confirmation_code?: string | null;
    confirmation_code_expires_at?: string | null;
    confirmation_code_used_at?: string | null;
  }) | undefined;
  if (!withdrawal) {
    throw new DbError("invalid_code", "That code is wrong, expired or already used.");
  }
  const now = new Date().toISOString();
  withdrawal.confirmation_code_used_at = now;
  withdrawal.status = "completed";
  const tx = state.transactions.find(
    (t) => t.user_id === user.id && t.reference === withdrawal.reference && t.kind === "withdrawal" && t.status === "pending",
  );
  if (tx) tx.status = "completed";
  state.notifications.push({
    id: `n-${Date.now()}`,
    user_id: user.id,
    title: "Withdrawal completed",
    body: `Your withdrawal of ${withdrawal.currency} ${Number(withdrawal.amount).toLocaleString()} has been completed.`,
    link: "/transactions",
    icon: null,
    read_at: null,
    created_at: now,
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
  const user = await requireSession();
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

  const acc = state.accounts.find((a) => a.user_id === user.id);
  const fee = round2(input.amount * (cfg.transfer_charges / 100));
  const total = round2(input.amount + fee);
  if (!acc || Number(acc.balance) < total) {
    throw new DbError("insufficient_funds", "Insufficient funds for this transfer.");
  }

  acc.balance = round2(acc.balance - total);
  const transferId = `tf-${Date.now()}`;
  const ref = `TFR-${Date.now().toString(36).toUpperCase()}`;
  state.transactions.push({
    id: transferId,
    user_id: user.id,
    account_id: acc.id,
    kind: "transfer",
    direction: "debit",
    amount: String(input.amount),
    currency: acc.currency,
    name: input.beneficiary_name ?? "Transfer sent",
    reference: ref,
    status: "pending",
    fee: String(fee),
    balance_after: String(acc.balance),
    created_at: new Date().toISOString(),
  });

  if (input.save_beneficiary && input.account_number) {
    const existing = state.beneficiaries.find(
      (b) => b.user_id === user.id && b.account_number === input.account_number,
    );
    if (existing) {
      existing.name = input.beneficiary_name ?? existing.name;
      existing.bank_name = input.bank_name ?? existing.bank_name;
      existing.swift = input.swift ?? existing.swift;
      existing.used_count = (existing.used_count ?? 0) + 1;
      existing.last_used_at = new Date().toISOString();
    } else {
      state.beneficiaries.push({
        id: `b-${Date.now()}`,
        user_id: user.id,
        name: input.beneficiary_name ?? "Beneficiary",
        bank: input.bank_name ?? null,
        bank_name: input.bank_name ?? null,
        account_number: input.account_number,
        swift: input.swift ?? null,
        account_type: input.account_type ?? null,
        routing_number: input.routing ?? null,
        country: null,
        bank_address: null,
        iban: null,
        crypto_currency: null,
        kind: input.scope === "international" ? "international" : "local",
        favorite: false,
        routing: input.routing ?? null,
        email: null,
        currency: acc.currency,
        nickname: null,
        used_count: 0,
        last_used_at: null,
        created_at: new Date().toISOString(),
      });
    }
  }
  return { fee, ref, transfer_id: transferId };
}

async function verifyTransfer(input: { transfer_id: string; code: string }) {
  const user = await requireSession();
  const supplied = String(input.code ?? "").trim();
  const record = transferCodes.get(String(input.transfer_id));
  const tx = state.transactions.find(
    (t) =>
      t.id === input.transfer_id && t.user_id === user.id && t.kind === "transfer" && t.status === "pending",
  );
  // The code must belong to THIS transfer, be unused and unexpired.
  if (!tx || !record || record.used_at || record.code !== supplied || record.expires_at < Date.now()) {
    throw new DbError("invalid_code", "That code is wrong, expired or already used.");
  }
  record.used_at = new Date().toISOString();
  tx.status = "completed";
  const pending = pendingMemberCredits.get(String(input.transfer_id));
  if (pending) {
    const recipientAcc = state.accounts.find((a) => a.user_id === pending.recipient_id);
    if (recipientAcc) {
      recipientAcc.balance = round2(recipientAcc.balance + pending.amount);
      state.transactions.push({
        id: `tx-${Date.now()}-r`,
        user_id: pending.recipient_id,
        account_id: recipientAcc.id,
        kind: "transfer",
        direction: "credit",
        amount: String(pending.amount),
        currency: pending.currency,
        name: `${user.full_name} (${user.email})`,
        reference: tx.reference,
        status: "completed",
        fee: "0.00",
        balance_after: String(recipientAcc.balance),
        created_at: new Date().toISOString(),
      });
      state.notifications.push({
        id: `n-${Date.now()}-r`,
        user_id: pending.recipient_id,
        title: "Transfer received",
        body: `${user.full_name} sent you $${pending.amount.toLocaleString()}.`,
        link: "/transactions",
        icon: null,
        read_at: null,
        created_at: new Date().toISOString(),
      });
    }
    pendingMemberCredits.delete(String(input.transfer_id));
  }
  const acc = state.accounts.find((a) => a.user_id === user.id);
  return { ok: true, balance_after: acc ? Number(acc.balance) : 0 };
}

async function uploadFile(input: { filename?: string; contentType?: string; data?: string }) {
  await requireSession();
  const filename = (input.filename ?? "upload.bin").replace(/[^\w.\-]+/g, "_").slice(-80);
  if (!input.data) throw new DbError("invalid_file", "No file content was provided.", 400);
  const raw = input.data.includes(",") ? input.data.split(",")[1] : input.data;
  const buf = Buffer.from(raw, "base64");
  if (buf.length === 0) throw new DbError("invalid_file", "The uploaded file is empty.");
  if (buf.length > 10 * 1024 * 1024) {
    throw new DbError("file_too_large", "Files must be 10MB or smaller.");
  }
  const contentType = input.contentType || "application/octet-stream";
  const url = `data:${contentType};base64,${raw}`;
  return { url, publicUrl: url, path: `mock/${Date.now()}-${filename}` };
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
  state.contactMessages.push({
    id: `cm-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    subject: input.subject?.trim() || null,
    message: input.message.trim(),
    handled: false,
    created_at: new Date().toISOString(),
  });
  return { ok: true };
}

async function createSupportTicket(input: { category: string; subject: string; message: string }) {
  const user = await requireSession();
  if (!input.subject || !input.message) {
    throw new DbError("invalid_input", "Subject and message are required.");
  }
  const id = `t-${Date.now()}`;
  const created = new Date().toISOString();
  state.tickets.push({
    id,
    user_id: user.id,
    subject: input.subject,
    category: input.category ?? "general",
    status: "open",
    created_at: created,
  });
  state.ticketMessages.push({
    id: `m-${Date.now()}`,
    ticket_id: id,
    sender: "user",
    body: input.message,
    created_at: created,
  });
  return { id };
}

async function createSupportMessage(id: string, body: string) {
  const user = await requireSession();
  if (!body || !body.trim()) {
    throw new DbError("invalid_input", "Message body is required.");
  }
  const ticket = state.tickets.find((t) => t.id === id && t.user_id === user.id);
  if (!ticket) throw new DbError("not_found", "Ticket not found.", 404);
  state.ticketMessages.push({
    id: `m-${Date.now()}`,
    ticket_id: id,
    sender: "user",
    body: body.trim(),
    created_at: new Date().toISOString(),
  });
  return { body: body.trim() };
}

async function transactionsEmail() {
  const user = await requireSession();
  return { ok: true, email: user.email };
}

async function markAllNotificationsRead() {
  return markNotificationsRead();
}

async function markNotificationRead(id: string) {
  const user = await requireSession();
  const n = state.notifications.find((x) => x.id === id && x.user_id === user.id);
  if (n) n.read_at = new Date().toISOString();
  return { ok: true };
}

async function deleteNotifications() {
  const user = await requireSession();
  state.notifications = state.notifications.filter((n) => n.user_id !== user.id);
  return { ok: true };
}

async function deleteNotification(id: string) {
  const user = await requireSession();
  state.notifications = state.notifications.filter((n) => !(n.id === id && n.user_id === user.id));
  return { ok: true };
}

async function markNotificationsRead(ids?: string[]) {
  const user = await requireSession();
  const target = state.notifications.filter(
    (n) => n.user_id === user.id && !n.read_at && (ids ? ids.includes(n.id) : true),
  );
  target.forEach((n) => (n.read_at = new Date().toISOString()));
  return { ok: true };
}

async function updateSettings(patch: Partial<SettingsRow>) {
  const user = await requireSession();
  const existing = state.settings.get(user.id) ?? {
    user_id: user.id,
    language: "en",
    currency: "USD",
    notifications: {},
    security: {},
    updated_at: now,
  };
  const merged = { ...existing, ...patch, user_id: user.id, updated_at: new Date().toISOString() };
  state.settings.set(user.id, merged);
  return { settings: merged };
}

async function updateProfile(patch: Partial<UserRow>) {
  const user = await requireSession();
  const updated = { ...user, ...patch, id: user.id };
  state.users.set(user.id, updated);
  return { user: mapUser(updated) };
}

async function submitKyc(patch: KycRecord) {
  const user = await requireSession();
  const updated = { ...user, kyc_status: "in_review" as const };
  state.users.set(user.id, updated);
  const existing = state.settings.get(user.id)?.security ?? {};
  await updateSettings({ security: { ...existing, kyc: patch } });
  return { ok: true };
}

async function setPin(input: { current_password?: string; pin: string }) {
  const user = await requireSession();
  if (!/^\d{4,6}$/.test(input.pin)) {
    throw new DbError("invalid_pin", "PIN must be 4 to 6 digits.");
  }
  const email = user.email;
  if (state.passwords.get(email) !== input.current_password) {
    throw new DbError("invalid_password", "Your account password is incorrect.");
  }
  const { hash } = await hashPassword(input.pin);
  state.users.set(user.id, { ...user, pin_hash: hash, pin_gate: false });
  return { ok: true };
}

async function verifyPin(pin: string) {
  const user = await requireSession();
  if (!user.pin_hash || !(await verifyPassword(pin, user.pin_hash))) {
    throw new DbError("invalid_pin", "Incorrect PIN.");
  }
  state.users.set(user.id, { ...user, pin_gate: false });
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
  const user = await requireSession();
  return {
    application: {
      id: `ca-${Date.now()}`,
      user_id: user.id,
      card_brand: input.card_brand ?? "visa",
      currency: input.currency ?? "USD",
      card_level: input.card_level ?? "standard",
      daily_limit: input.daily_limit ?? null,
      billing_address: input.billing_address ?? null,
      billing_city: input.billing_city ?? null,
      billing_zip: input.billing_zip ?? null,
      status: "pending",
      created_at: new Date().toISOString(),
    },
  };
}

async function applyLoan(input: { amount: number; interest_rate?: number; term_months?: number }) {
  const user = await requireSession();
  if (!input.amount || input.amount <= 0) throw new DbError("invalid_amount", "Enter a valid amount.");
  const loan: LoanRow = {
    id: `l-${Date.now()}`,
    user_id: user.id,
    amount: String(input.amount),
    interest_rate: String(input.interest_rate ?? 0),
    term_months: input.term_months ?? null,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  state.loans.push(loan);
  return { loan };
}

async function applyGrant(input: { program: string; amount?: number }) {
  const user = await requireSession();
  if (!input.program) throw new DbError("invalid_program", "Program is required.");
  const grant: GrantRow = {
    id: `g-${Date.now()}`,
    user_id: user.id,
    program: input.program,
    amount: input.amount ? String(input.amount) : null,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  state.grants.push(grant);
  return { grant };
}

/* ------------------------------------------------------------------------- */
/* Auth                                                                      */
/* ------------------------------------------------------------------------- */

async function loginMethod(_slug?: string) {
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
  if ([...state.users.values()].some((u) => u.email === email)) {
    throw new DbError("email_exists", "An account with that email already exists.", 409);
  }
  const id = `u-${Date.now()}`;
  const user: UserRow = {
    id,
    email,
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    full_name: `${input.first_name.trim()} ${input.last_name.trim()}`,
    photo_url: "",
    phone: input.phone ?? null,
    country: "US",
    currency: "USD",
    role: "user",
    status: "active",
    kyc_status: "not_submitted",
    kyc_required: true,
    email_verified_at: now,
    pin_gate: false,
    pin_hash: null,
    account_number: generateAccountNumber(),
    referral_code: input.ref_code || null,
    twofa_enabled: false,
    created_at: now,
  };
  if (input.pin) {
    const { hash } = await hashPassword(input.pin);
    user.pin_hash = hash;
  }
  state.users.set(id, user);
  state.passwords.set(email, input.password);
  state.accounts.push({
    id: `a-${id}`,
    user_id: id,
    currency: "USD",
    balance: 0,
    available: 0,
    account_number: user.account_number,
    status: "active",
  });
  state.crypto.push(
    { id: `cr-${id}-1`, user_id: id, symbol: "BTC", name: "Bitcoin", balance: "0", price_usd: "61500", created_at: now },
    { id: `cr-${id}-2`, user_id: id, symbol: "ETH", name: "Ethereum", balance: "0", price_usd: "3400", created_at: now },
  );
  state.settings.set(id, {
    user_id: id,
    language: "en",
    currency: "USD",
    notifications: {},
    security: {},
    updated_at: now,
  });
  state.notifications.push({
    id: `n-${Date.now()}`,
    user_id: id,
    title: "Welcome to Tesla Model",
    body: "Your account is ready. Complete your KYC to unlock all features.",
    link: "/settings/kyc",
    icon: null,
    read_at: null,
    created_at: now,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { user_id: id, email, needs_email_verification: false, dev_code: undefined };
}

async function login(input: { email?: string; password?: string; acknowledge?: boolean }) {
  let user: UserRow | undefined;

  if (input.email && input.password) {
    const email = input.email.trim().toLowerCase();
    user = [...state.users.values()].find((u) => u.email === email);
    if (!user || state.passwords.get(email) !== input.password) {
      throw new DbError("invalid_credentials", "Email or password is incorrect.", 401);
    }
  } else {
    throw new DbError("invalid_credentials", "Email or password is incorrect.", 401);
  }

  if (user.status === "blocked") {
    throw new DbError("account_blocked", "This account is blocked. Please contact support.");
  }
  if (user.status !== "active" && !input.acknowledge) {
    throw new DbError(
      "account_restricted",
      "Your account currently has a restriction. You can continue, but some features may be limited.",
      403,
      {
        allow_proceed: true,
        account_status: user.status.replace(/-/g, " "),
        message: "Your account currently has a restriction. You can continue, but some features may be limited.",
      },
    );
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { ok: true };
}

async function login2fa(input: { challenge: string; code: string }) {
  const entry = state.challenges.get(input.challenge);
  if (!entry || entry.expires_at < Date.now()) {
    throw new DbError("challenge_expired", "That took too long — please sign in again.", 410);
  }
  if (entry.code !== input.code) throw new DbError("invalid_code", "That code is wrong.");
  state.challenges.delete(input.challenge);

  const store = await cookies();
  store.set(SESSION_COOKIE, entry.user_id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true };
}

async function forgotPassword(input: { email: string }) {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new DbError("invalid_email", "Enter your email address.");
  if (!state.passwords.has(email)) throw new DbError("invalid_email", "Enter your email address.");
  const code = generateNumericCode();
  state.resetCodes.set(email, { code, expires_at: Date.now() + 15 * 60 * 1000 });
  console.warn(`[mailer] password reset code for ${email}: ${code}`);
  return { ok: true };
}

async function resetPassword(input: { email: string; code: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  if (!input.password || input.password.length < 8) {
    throw new DbError("weak_password", "Password must be at least 8 characters.");
  }
  const entry = state.resetCodes.get(email);
  if (!entry || entry.expires_at < Date.now()) {
    throw new DbError("invalid_or_expired_code", "Code is wrong or expired.", 410);
  }
  if (entry.code !== input.code) {
    throw new DbError("invalid_or_expired_code", "Code is wrong or expired.", 410);
  }
  if (!state.passwords.has(email)) {
    throw new DbError("invalid_or_expired_code", "Code is wrong or expired.", 410);
  }
  state.passwords.set(email, input.password);
  state.resetCodes.delete(email);
  return { ok: true };
}

async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(PENDING_VERIFY_COOKIE);
  return { ok: true };
}

async function verifyEmail(input: { code: string }) {
  const user = await requireSession();
  const store = await cookies();
  const code = store.get(PENDING_VERIFY_COOKIE)?.value;
  if (!code || code !== input.code) {
    throw new DbError("invalid_or_expired_code", "Code is wrong or expired.", 410);
  }
  if (user.email_verified_at) return { ok: true };
  state.users.set(user.id, { ...user, email_verified_at: now });
  store.delete(PENDING_VERIFY_COOKIE);
  return { ok: true };
}

async function resendVerifyCode() {
  const user = await requireSession();
  if (user.email_verified_at) return { already_verified: true, resend_in: 0 };
  const store = await cookies();
  store.set(PENDING_VERIFY_COOKIE, generateNumericCode(), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 10 * 60,
  });
  return { resend_in: 120 };
}

async function resendVerifyStatus() {
  return { resend_in: 120 };
}

/* ------------------------------------------------------------------------- */
/* Admin                                                                     */
/* ------------------------------------------------------------------------- */

async function requireAdmin() {
  const user = await requireSession();
  if (user.role !== "admin") throw new DbError("forbidden", "You do not have access to this area.", 403);
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
  let actor: UserRow | null = null;
  try {
    actor = await requireSession();
  } catch {
    actor = null;
  }
  state.auditLogs.unshift({
    id: `al-${Date.now()}-${state.auditLogs.length}`,
    admin_id: actor?.id ?? null,
    admin_email: actor?.email ?? null,
    action: input.action,
    target_type: input.target_type ?? null,
    target_id: input.target_id ?? null,
    target_label: input.target_label ?? null,
    details: input.details ?? {},
    created_at: new Date().toISOString(),
  });
}

async function adminMe(slug?: string) {
  const user = await requireAdmin();
  const site = state.site;
  return {
    site,
    user: mapUser(user),
    admin: {
      permissions: ["super", "users", "kyc", "deposits", "withdrawals", "cards", "loans", "grants", "crm", "content", "appearance", "settings", "audit", "broadcast", "chat"],
      is_super: true,
    },
  };
}

async function adminOverview() {
  await requireAdmin();
  const users = [...state.users.values()];
  const active = users.filter((u) => u.status === "active").length;
  const blocked = users.filter((u) => u.status === "blocked" || u.status === "disabled" || u.status === "restricted" || u.status === "suspended").length;
  const totalDeposits = state.deposits.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
  const pendingDeposits = state.deposits.filter((d) => d.status === "processing" || d.status === "pending").reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
  const totalTransfers = state.withdrawals.reduce((sum, w) => sum + Number(w.amount ?? 0), 0);
  const pendingTransfers = state.withdrawals.filter((w) => w.status === "pending").reduce((sum, w) => sum + Number(w.amount ?? 0), 0);
  return {
    counts: {
      currency: state.site.primary_currency ?? "USD",
      total_deposits: totalDeposits,
      pending_deposits: pendingDeposits,
      total_transfers: totalTransfers,
      pending_transfers: pendingTransfers,
      total_users: users.length,
      active_users: active,
      blocked_users: blocked,
    },
  };
}

async function adminUsers(q?: string, status?: string) {
  await requireAdmin();
  let rows = [...state.users.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (q) {
    const s = q.toLowerCase();
    rows = rows.filter(
      (u) =>
        u.email.toLowerCase().includes(s) ||
        (u.first_name ?? "").toLowerCase().includes(s) ||
        (u.last_name ?? "").toLowerCase().includes(s),
    );
  }
  if (status) rows = rows.filter((u) => u.status === status);
  return {
    users: rows.map((u) => ({
      ...mapUser(u),
      member_no: String(1000 + rows.indexOf(u)),
      two_fa_enabled: u.twofa_enabled,
    })),
  };
}

async function adminTransactions(limit = 100) {
  await requireAdmin();
  const rows = [...state.transactions]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
  return { transactions: rows.map(mapTransaction) };
}

/* ------------------------------------------------------------------------- */
/* Admin: deposits / withdrawals / cards / loans / grants / user management  */
/* ------------------------------------------------------------------------- */

interface AdminListOptions {
  search?: string;
  status?: string;
}

function emailOf(userId: string): string | undefined {
  return state.users.get(userId)?.email;
}

function applyListFilters<T extends { created_at: string; status: string }>(
  rows: T[],
  opts: AdminListOptions,
  matchSearch: (row: T, term: string) => boolean,
): T[] {
  let out = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 200);
  if (opts.status) out = out.filter((r) => r.status === opts.status);
  if (opts.search) {
    const term = opts.search.trim().toLowerCase();
    if (term) out = out.filter((r) => matchSearch(r, term));
  }
  return out;
}

async function adminDeposits(opts: AdminListOptions = {}) {
  await requireAdmin();
  const rows = applyListFilters(state.deposits, opts, (d, t) => {
    const email = (emailOf(d.user_id) ?? "").toLowerCase();
    return (
      d.method.toLowerCase().includes(t) ||
      (d.reference ?? "").toLowerCase().includes(t) ||
      email.includes(t)
    );
  });
  return {
    deposits: rows.map((d) => ({ ...d, amount: String(d.amount), email: emailOf(d.user_id) })),
  };
}

async function setDepositStatus(input: { id?: string; status?: string }) {
  await requireAdmin();
  if (!input.id || !input.status) throw new DbError("invalid_request", "Missing deposit id or status.");
  const allowed = ["processing", "pending", "completed", "failed"];
  if (!allowed.includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
  const deposit = state.deposits.find((d) => d.id === input.id);
  if (!deposit) throw new DbError("not_found", "Deposit not found.", 404);
  const previous = deposit.status;
  // Guard against approving the same deposit twice.
  if (previous === input.status || (input.status === "completed" && previous === "completed")) {
    return { ok: true };
  }
  deposit.status = input.status;
  await writeAudit({
    action: `deposit.${input.status}`,
    target_type: "deposit",
    target_id: deposit.id,
    target_label: deposit.reference ?? undefined,
    details: { user_id: deposit.user_id, amount: deposit.amount, currency: deposit.currency, from: previous, to: input.status },
  });
  if (input.status === "completed" && previous !== "completed") {
    const account = state.accounts.find(
      (a) => a.user_id === deposit.user_id && a.currency === deposit.currency,
    );
    if (account) {
      account.balance = Number(account.balance) + Number(deposit.amount);
      account.available = Number(account.available) + Number(deposit.amount);
      state.transactions.push({
        id: `t-${Date.now()}`,
        user_id: deposit.user_id,
        account_id: account.id,
        kind: "deposit",
        direction: "credit",
        amount: String(deposit.amount),
        currency: deposit.currency,
        name: "Deposit",
        reference: null,
        status: "completed",
        fee: "0",
        balance_after: String(account.balance),
        created_at: new Date().toISOString(),
      });
      state.notifications.push({
        id: `n-${Date.now()}`,
        user_id: deposit.user_id,
        title: "Deposit approved",
        body: `Your deposit of ${deposit.currency} ${Number(deposit.amount).toLocaleString()} has been credited.`,
        link: "/deposits",
        icon: null,
        read_at: null,
        created_at: new Date().toISOString(),
      });
    }
  }
  return { ok: true };
}

async function adminWithdrawals(opts: AdminListOptions = {}) {
  await requireAdmin();
  const rows = applyListFilters(state.withdrawals, opts, (w, t) => {
    const email = (emailOf(w.user_id) ?? "").toLowerCase();
    return (
      w.method.toLowerCase().includes(t) ||
      (w.account_number ?? "").toLowerCase().includes(t) ||
      (w.reference ?? "").toLowerCase().includes(t) ||
      email.includes(t)
    );
  });
  return {
    withdrawals: rows.map((w) => ({
      ...w,
      amount: String(w.amount),
      email: emailOf(w.user_id),
    })),
  };
}

async function setWithdrawalStatus(input: { id?: string; status?: string }) {
  await requireAdmin();
  if (!input.id || !input.status)
    throw new DbError("invalid_request", "Missing withdrawal id or status.");
  const allowed = ["pending", "processing", "completed", "rejected", "failed"];
  if (!allowed.includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
  const withdrawal = state.withdrawals.find((w) => w.id === input.id);
  if (!withdrawal) throw new DbError("not_found", "Withdrawal not found.", 404);
  const previous = withdrawal.status;
  if (previous === input.status) return { ok: true };
  const refunding =
    (input.status === "rejected" || input.status === "failed") &&
    previous !== "rejected" &&
    previous !== "failed";
  withdrawal.status = input.status;
  await writeAudit({
    action: `withdrawal.${input.status}`,
    target_type: "withdrawal",
    target_id: withdrawal.id,
    details: { user_id: withdrawal.user_id, amount: withdrawal.amount, currency: withdrawal.currency, from: previous, to: input.status, refunded: refunding },
  });
  if (refunding) {
    const account = state.accounts.find(
      (a) => a.user_id === withdrawal.user_id && a.currency === withdrawal.currency,
    );
    if (account) {
      account.balance = Number(account.balance) + Number(withdrawal.amount);
      account.available = Number(account.available) + Number(withdrawal.amount);
      state.transactions.push({
        id: `t-${Date.now()}`,
        user_id: withdrawal.user_id,
        account_id: account.id,
        kind: "credited",
        direction: "credit",
        amount: String(withdrawal.amount),
        currency: withdrawal.currency,
        name: "Withdrawal reversed",
        reference: null,
        status: "completed",
        fee: "0",
        balance_after: String(account.balance),
        created_at: new Date().toISOString(),
      });
    }
  }
  return { ok: true };
}

async function adminCards() {
  await requireAdmin();
  return {
    cards: state.cards.map((c) => ({ ...c, email: emailOf(c.user_id) })),
    applications: [] as (CardApplicationRow & { email?: string })[],
  };
}

async function setCardStatus(input: { id?: string; status?: string; frozen?: boolean }) {
  await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing card id.");
  const card = state.cards.find((c) => c.id === input.id);
  if (!card) throw new DbError("not_found", "Card not found.", 404);
  if (input.frozen !== undefined) card.frozen = input.frozen;
  if (input.status) {
    const allowed = ["active", "inactive", "blocked", "closed", "expired"];
    if (!allowed.includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
    card.status = input.status;
  }
  await writeAudit({ action: "card.update", target_type: "card", target_id: card.id, details: { status: input.status, frozen: input.frozen } });
  return { ok: true };
}

async function setCardApplicationStatus(input: { id?: string; status?: string }) {
  await requireAdmin();
  if (!input.id || !input.status)
    throw new DbError("invalid_request", "Missing application id or status.");
  const allowed = ["pending", "approved", "declined"];
  if (!allowed.includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
  return { ok: true };
}

async function adminLoans(opts: AdminListOptions = {}) {
  await requireAdmin();
  const rows = applyListFilters(state.loans, opts, () => false);
  return { loans: rows.map((l) => ({ ...l, amount: String(l.amount), email: emailOf(l.user_id) })) };
}

async function setLoanStatus(input: { id?: string; status?: string }) {
  await requireAdmin();
  if (!input.id || !input.status) throw new DbError("invalid_request", "Missing loan id or status.");
  const allowed = ["pending", "approved", "active", "rejected", "completed", "declined"];
  if (!allowed.includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
  const loan = state.loans.find((l) => l.id === input.id);
  if (!loan) throw new DbError("not_found", "Loan not found.", 404);
  const previous = loan.status;
  loan.status = input.status;
  await writeAudit({
    action: `loan.${input.status}`,
    target_type: "loan",
    target_id: loan.id,
    details: { user_id: loan.user_id, amount: loan.amount, from: previous, to: input.status },
  });
  return { ok: true };
}

async function adminGrants(opts: AdminListOptions = {}) {
  await requireAdmin();
  const rows = applyListFilters(state.grants, opts, (g, t) =>
    g.program.toLowerCase().includes(t),
  );
  return { grants: rows.map((g) => ({ ...g, email: emailOf(g.user_id) })) };
}

async function setGrantStatus(input: { id?: string; status?: string }) {
  await requireAdmin();
  if (!input.id || !input.status) throw new DbError("invalid_request", "Missing grant id or status.");
  const allowed = ["pending", "approved", "rejected", "completed", "declined"];
  if (!allowed.includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
  const grant = state.grants.find((g) => g.id === input.id);
  if (!grant) throw new DbError("not_found", "Grant not found.", 404);
  grant.status = input.status;
  await writeAudit({ action: `grant.${input.status}`, target_type: "grant", target_id: grant.id, details: { to: input.status } });
  return { ok: true };
}

async function adminSetUserStatus(input: { id?: string; status?: string }) {
  await requireAdmin();
  if (!input.id || !input.status) throw new DbError("invalid_request", "Missing user id or status.");
  const allowed = ["active", "suspended", "disabled"];
  if (!allowed.includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
  const user = state.users.get(input.id);
  if (!user) throw new DbError("not_found", "User not found.", 404);
  user.status = input.status as typeof user.status;
  await writeAudit({ action: `user.${input.status}`, target_type: "user", target_id: input.id, details: { to: input.status } });
  return { ok: true };
}

async function adminUserDetail(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing user id.");
  const user = state.users.get(id);
  if (!user) throw new DbError("not_found", "User not found.", 404);
  const security = state.settings.get(id)?.security ?? {};
  return {
    user: mapUser(user),
    accounts: state.accounts.filter((a) => a.user_id === id),
    transactions: state.transactions
      .filter((t) => t.user_id === id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 50)
      .map(mapTransaction),
    cards: state.cards.filter((c) => c.user_id === id),
    kyc: (security.kyc && typeof security.kyc === "object" ? security.kyc : {}) as Record<string, unknown>,
  };
}

/* ------------------------------------------------------------------------- */
/* Mock: user management                                                     */
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
}) {
  await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing user id.");
  const user = state.users.get(input.id);
  if (!user) throw new DbError("not_found", "User not found.", 404);
  const patch: Record<string, unknown> = {};
  if (input.first_name !== undefined) { user.first_name = input.first_name.trim(); patch.first_name = input.first_name; }
  if (input.last_name !== undefined) { user.last_name = input.last_name.trim(); patch.last_name = input.last_name; }
  if (input.phone !== undefined) { user.phone = input.phone; patch.phone = input.phone; }
  if (input.country !== undefined) { user.country = input.country; patch.country = input.country; }
  if (input.status !== undefined) {
    if (!["active", "suspended", "disabled"].includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
    user.status = input.status as typeof user.status;
    patch.status = input.status;
  }
  if (input.kyc_status !== undefined) {
    if (!["not_submitted", "in_review", "verified", "rejected"].includes(input.kyc_status)) throw new DbError("invalid_status", "Unsupported KYC status.");
    user.kyc_status = input.kyc_status as typeof user.kyc_status;
    patch.kyc_status = input.kyc_status;
  }
  if (input.email_verified !== undefined) {
    user.email_verified_at = input.email_verified ? new Date().toISOString() : null;
    patch.email_verified = input.email_verified;
  }
  await writeAudit({ action: "user.update", target_type: "user", target_id: user.id, target_label: user.email, details: patch });
  return { ok: true, user: mapUser(user) };
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
  const account = state.accounts.find((a) => a.user_id === input.user_id && a.currency === currency);
  if (!account) throw new DbError("not_found", "No account in that currency.", 404);
  if (direction === "debit" && account.balance < amount) {
    throw new DbError("insufficient_funds", "The user has insufficient funds for this deduction.");
  }
  account.balance = Number(
    (direction === "credit" ? account.balance + amount : account.balance - amount).toFixed(2),
  );
  account.available = Number(account.available.toFixed(2));
  state.transactions.push({
    id: `t-${Date.now()}`,
    user_id: input.user_id,
    account_id: account.id,
    kind: "adjustment",
    direction,
    amount: String(amount),
    currency,
    name: direction === "credit" ? "Bank Transfer" : "Bank Debit",
    reference: input.reason ?? null,
    status: "completed",
    fee: "0",
    balance_after: String(account.balance),
    created_at: new Date().toISOString(),
  });
  await writeAudit({
    action: `balance.${direction}`,
    target_type: "account",
    target_id: input.user_id,
    details: { amount, currency, reason: input.reason ?? null },
  });
  return { ok: true, balance_after: String(account.balance) };
}

async function changePassword(_input: { current_password?: string; new_password?: string }) {
  await requireSession();
  return { ok: true };
}

async function securityStatus() {
  const user = await requireSession();
  return {
    twofa_enabled: Boolean(user.twofa_enabled),
    twofa_method: "email" as const,
    pin_set: Boolean(user.pin_hash),
    email: user.email,
    email_verified: Boolean(user.email_verified_at),
    updated_at: null as string | null,
  };
}

async function setTwofa(input: { enabled?: boolean; current_password?: string }) {
  const user = await requireSession();
  user.twofa_enabled = Boolean(input.enabled);
  return { ok: true, twofa_enabled: user.twofa_enabled };
}

async function sendTestEmail(_input: { to?: string }) {
  await requireAdmin();
  return { ok: true };
}

async function adminCreateTransaction(input: {
  user_id?: string;
  kind?: string;
  direction?: "credit" | "debit";
  amount?: number | string;
  name?: string;
  apply_balance?: boolean;
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
  const account = state.accounts.find((a) => a.user_id === input.user_id && a.currency === currency);
  const mode =
    input.mode === "balance" || input.mode === "history" || input.mode === "both"
      ? input.mode
      : input.apply_balance === false
        ? "history"
        : "both";
  const apply = mode !== "history" && Boolean(account);
  let balanceAfter: string | null = null;
  if (apply && account) {
    if (direction === "debit" && account.balance < amount) {
      throw new DbError("insufficient_funds", "The user has insufficient funds.");
    }
    account.balance = Number(
      (direction === "credit" ? account.balance + amount : account.balance - amount).toFixed(2),
    );
    balanceAfter = String(account.balance);
  }
  const txn = {
    id: `t-${Date.now()}`,
    user_id: input.user_id,
    account_id: account?.id ?? null,
    kind,
    direction: direction as "credit" | "debit",
    amount: String(amount),
    currency,
          name:
        input.name?.trim() ||
        (kind === "credited" || kind === "adjustment"
          ? direction === "credit"
            ? "Bank Transfer"
            : "Bank Debit"
          : kind.charAt(0).toUpperCase() + kind.slice(1)),
    reference: null,
    status: "completed",
    fee: "0",
    balance_after: balanceAfter,
    created_at: new Date().toISOString(),
  };
  state.transactions.push(txn);
  await writeAudit({
    action: "transaction.create",
    target_type: "transaction",
    target_id: txn.id,
    details: { user_id: input.user_id, kind, direction, amount, apply_balance: apply },
  });
  return { ok: true, transaction: txn };
}

async function adminDeleteUser(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing user id.");
  const user = state.users.get(id);
  if (!user) throw new DbError("not_found", "User not found.", 404);
  const actor = await requireSession();
  if (actor.id === id) throw new DbError("forbidden", "You cannot delete your own account.", 403);
  state.users.delete(id);
  state.accounts = state.accounts.filter((a) => a.user_id !== id);
  state.cards = state.cards.filter((c) => c.user_id !== id);
  state.deposits = state.deposits.filter((d) => d.user_id !== id);
  state.withdrawals = state.withdrawals.filter((w) => w.user_id !== id);
  state.loans = state.loans.filter((l) => l.user_id !== id);
  state.grants = state.grants.filter((g) => g.user_id !== id);
  await writeAudit({ action: "user.delete", target_type: "user", target_id: id, target_label: user.email });
  return { ok: true };
}

async function getAuditLogs(limit = 100) {
  await requireAdmin();
  return { logs: state.auditLogs.slice(0, limit) };
}

/* ------------------------------------------------------------------------- */
/* Mock: config / payment methods                                            */
/* ------------------------------------------------------------------------- */

async function setAdminConfig(key?: string, value?: Record<string, unknown> | unknown[] | null) {
  await requireAdmin();
  if (!key || value === undefined) throw new DbError("invalid_request", "Missing config key or value.");
  state.config.set(key, value);
  await writeAudit({ action: "config.update", target_type: "config", target_id: key, details: { value } });
  return { ok: true };
}

async function getAdminConfig(key?: string) {
  await requireAdmin();
  if (!key) {
    return { config: [...state.config.entries()].map(([k, v]) => ({ key: k, value: v })) };
  }
  return { value: state.config.get(key) ?? null };
}

async function adminTogglePaymentMethod(input: { id?: string; enabled?: boolean }) {
  await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing method id.");
  const disabled = new Set(
    Array.isArray(state.config.get("payment_methods_disabled"))
      ? (state.config.get("payment_methods_disabled") as string[])
      : [],
  );
  if (input.enabled === false) disabled.add(input.id);
  else disabled.delete(input.id);
  return setAdminConfig("payment_methods_disabled", [...disabled]);
}

/* ------------------------------------------------------------------------- */
/* Mock: KYC / verifications / transfers / referrals / import                */
/* ------------------------------------------------------------------------- */

async function adminKyc(status?: string) {
  await requireAdmin();
  const submissions = [...state.settings.entries()]
    .map(([user_id, s]) => {
      const u = state.users.get(user_id);
      if (!u || u.kyc_status === "not_submitted") return null;
      if (status && u.kyc_status !== status) return null;
      const security = (s.security ?? {}) as { kyc?: Record<string, unknown> };
      return {
        user_id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        kyc_status: u.kyc_status,
        created_at: u.created_at,
        kyc: security.kyc ?? {},
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return { submissions };
}

async function adminVerifications() {
  await requireAdmin();
  const users = [...state.users.values()];
  return {
    unverified_emails: users
      .filter((u) => !u.email_verified_at)
      .map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, email_verified_at: null })),
    kyc_review: users
      .filter((u) => u.kyc_status === "in_review" || u.kyc_status === "rejected")
      .map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, kyc_status: u.kyc_status, email_verified_at: u.email_verified_at })),
  };
}

async function adminTransfers(search?: string, status?: string) {
  await requireAdmin();
  let rows = state.transactions.filter((t) => t.kind === "transfer");
  if (status) rows = rows.filter((t) => t.status === status);
  if (search) {
    const term = search.trim().toLowerCase();
    rows = rows.filter(
      (t) =>
        t.name?.toLowerCase().includes(term) ||
        t.reference?.toLowerCase().includes(term) ||
        (emailOf(t.user_id) ?? "").toLowerCase().includes(term),
    );
  }
  return {
    transfers: rows
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 200)
      .map((t) => ({ ...t, email: emailOf(t.user_id) })),
  };
}

async function setTransferStatus(input: { id?: string; status?: string }) {
  await requireAdmin();
  if (!input.id || !input.status) throw new DbError("invalid_request", "Missing id or status.");
  if (!["pending", "completed", "failed", "cancelled"].includes(input.status)) {
    throw new DbError("invalid_status", "Unsupported status.");
  }
  const txn = state.transactions.find((t) => t.id === input.id);
  if (!txn) throw new DbError("not_found", "Transaction not found.", 404);
  txn.status = input.status;
  await writeAudit({ action: `transfer.${input.status}`, target_type: "transaction", target_id: input.id });
  return { ok: true };
}

async function adminReferrals() {
  await requireAdmin();
  const usage = new Map<string, number>();
  for (const u of state.users.values()) {
    if (!u.referral_code) continue;
    usage.set(u.referral_code, (usage.get(u.referral_code) ?? 0) + 1);
  }
  return {
    referrals: [...state.users.values()]
      .filter((u) => Boolean(u.referral_code))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.full_name || u.email,
        code_used: u.referral_code as string,
        joined_at: u.created_at,
        total_for_code: usage.get(u.referral_code as string) ?? 1,
      })),
  };
}

async function adminImportUsers(input: { rows?: { email?: string; first_name?: string; last_name?: string; password?: string }[] }) {
  await requireAdmin();
  const rows = input.rows ?? [];
  if (rows.length === 0) throw new DbError("invalid_input", "No rows to import.");
  if (rows.length > 100) throw new DbError("invalid_input", "Import at most 100 users at a time.");
  const created: string[] = [];
  const errors: { email?: string; error: string }[] = [];
  for (const row of rows) {
    const email = row.email?.trim().toLowerCase() ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ email, error: "Invalid email." });
      continue;
    }
    if ([...state.users.values()].some((u) => u.email === email)) {
      errors.push({ email, error: "Email already exists." });
      continue;
    }
    const password = row.password && row.password.length >= 8 ? row.password : generateNumericCode() + "Aa";
    state.passwords.set(email, password);
    const id = `u-${Date.now()}-${created.length}`;
    const now = new Date().toISOString();
    const user: UserRow = {
      id,
      email,
      first_name: row.first_name?.trim() || email.split("@")[0],
      last_name: row.last_name?.trim() || "",
      full_name: `${row.first_name?.trim() || email.split("@")[0]} ${row.last_name?.trim() || ""}`.trim(),
      photo_url: "",
      phone: null,
      country: "US",
      currency: "USD",
      role: "user",
      status: "active",
      kyc_status: "not_submitted",
      kyc_required: true,
      email_verified_at: now,
      pin_gate: false,
      pin_hash: null,
      account_number: generateAccountNumber(),
      referral_code: null,
      twofa_enabled: false,
      created_at: now,
    };
    state.users.set(id, user);
    state.accounts.push({
      id: `a-${id}`,
      user_id: id,
      currency: "USD",
      balance: 0,
      available: 0,
      account_number: user.account_number,
      status: "active",
    });
    created.push(email);
  }
  await writeAudit({ action: "users.import", target_type: "user", details: { created: created.length, failed: errors.length } });
  return { created, errors, passwords: Object.fromEntries(created.map((e) => [e, null])) };
}

/* ------------------------------------------------------------------------- */
/* Mock: leads / tasks CRUD                                                  */
/* ------------------------------------------------------------------------- */

async function adminLeads(search?: string, status?: string) {
  await requireAdmin();
  let rows = [...state.leads].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (status) rows = rows.filter((l) => l.status === status);
  if (search) {
    const term = search.trim().toLowerCase();
    rows = rows.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        (l.email ?? "").toLowerCase().includes(term) ||
        (l.phone ?? "").includes(term),
    );
  }
  return { leads: rows.slice(0, 200) };
}

async function saveLead(input: Partial<LeadRow>) {
  await requireAdmin();
  if (!input.name || !input.name.trim()) throw new DbError("invalid_name", "Lead name is required.");
  const patch = {
    name: input.name.trim(),
    email: input.email ?? null,
    phone: input.phone ?? null,
    source: input.source ?? "manual",
    status: input.status ?? "new",
    notes: input.notes ?? null,
  };
  if (input.id) {
    const lead = state.leads.find((l) => l.id === input.id);
    if (!lead) throw new DbError("not_found", "Lead not found.", 404);
    Object.assign(lead, patch);
    await writeAudit({ action: "lead.update", target_type: "lead", target_id: lead.id, details: { name: patch.name } });
    return { lead };
  }
  const lead: LeadRow = { id: `lead-${Date.now()}`, created_at: new Date().toISOString(), ...patch };
  state.leads.unshift(lead);
  await writeAudit({ action: "lead.create", target_type: "lead", target_id: lead.id, details: { name: patch.name } });
  return { lead };
}

async function deleteLead(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing lead id.");
  state.leads = state.leads.filter((l) => l.id !== id);
  await writeAudit({ action: "lead.delete", target_type: "lead", target_id: id });
  return { ok: true };
}

async function adminTasks(status?: string) {
  await requireAdmin();
  let rows = [...state.tasks].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (status) rows = rows.filter((t) => t.status === status);
  return { tasks: rows.slice(0, 200) };
}

async function saveTask(input: Partial<AdminTaskRow>) {
  await requireAdmin();
  if (!input.title || !input.title.trim()) throw new DbError("invalid_input", "Task title is required.");
  const patch = {
    title: input.title.trim(),
    description: input.description ?? null,
    assignee: input.assignee ?? null,
    priority: input.priority ?? "medium",
    status: input.status ?? "pending",
    due_at: input.due_at ?? null,
  };
  if (input.id) {
    const task = state.tasks.find((t) => t.id === input.id);
    if (!task) throw new DbError("not_found", "Task not found.", 404);
    Object.assign(task, patch);
    await writeAudit({ action: "task.update", target_type: "task", target_id: task.id, details: { title: patch.title } });
    return { task };
  }
  const task: AdminTaskRow = { id: `task-${Date.now()}`, created_at: new Date().toISOString(), ...patch };
  state.tasks.unshift(task);
  await writeAudit({ action: "task.create", target_type: "task", target_id: task.id, details: { title: patch.title } });
  return { task };
}

async function deleteTask(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing task id.");
  state.tasks = state.tasks.filter((t) => t.id !== id);
  await writeAudit({ action: "task.delete", target_type: "task", target_id: id });
  return { ok: true };
}

/* ------------------------------------------------------------------------- */
/* Mock: currencies / IRS / memberships                                      */
/* ------------------------------------------------------------------------- */

async function adminCurrencies() {
  await requireAdmin();
  return { currencies: [...state.currencies].sort((a, b) => a.code.localeCompare(b.code)) };
}

async function saveCurrency(input: Partial<SiteCurrencyRow>) {
  await requireAdmin();
  if (!input.code || !input.name) throw new DbError("invalid_input", "Currency code and name are required.");
  const code = input.code.toUpperCase();
  const existing = state.currencies.find((c) => c.code === code);
  const patch = {
    code,
    name: input.name,
    symbol: input.symbol || "$",
    rate: String(Number(input.rate ?? 1)),
    enabled: input.enabled ?? true,
  };
  if (existing) {
    Object.assign(existing, patch);
    await writeAudit({ action: "currency.save", target_type: "currency", target_id: code, details: patch });
    return { currency: existing };
  }
  const currency: SiteCurrencyRow = { id: `cur-${Date.now()}`, created_at: new Date().toISOString(), ...patch };
  state.currencies.push(currency);
  await writeAudit({ action: "currency.save", target_type: "currency", target_id: code, details: patch });
  return { currency };
}

async function deleteCurrency(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing currency id.");
  state.currencies = state.currencies.filter((c) => c.id !== id);
  await writeAudit({ action: "currency.delete", target_type: "currency", target_id: id });
  return { ok: true };
}

async function adminIrsRefunds(search?: string, status?: string) {
  await requireAdmin();
  let rows = [...state.irsRefunds].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (status) rows = rows.filter((r) => r.status === status);
  if (search) rows = rows.filter((r) => (r.email ?? "").toLowerCase().includes(search.trim().toLowerCase()));
  return { refunds: rows.slice(0, 200) };
}

async function saveIrsRefund(input: { id?: string; user_id?: string; tax_year?: number; amount?: number; status?: string; notes?: string }) {
  await requireAdmin();
  let userId = input.user_id;
  if (input.id && !userId) {
    userId = state.irsRefunds.find((r) => r.id === input.id)?.user_id;
  }
  if (!userId) throw new DbError("invalid_input", "Select a user for the refund.");
  const patch = {
    user_id: userId,
    tax_year: parseAmountInput(input.tax_year ?? {}) ?? 2025,
    amount: String(parseAmountInput(input.amount ?? {}) ?? 0),
    status: input.status ?? "pending",
    notes: input.notes ?? null,
  };
  if (input.id) {
    const refund = state.irsRefunds.find((r) => r.id === input.id);
    if (!refund) throw new DbError("not_found", "Refund not found.", 404);
    Object.assign(refund, patch, { email: emailOf(String(patch.user_id)) });
    await writeAudit({ action: "irs.update", target_type: "irs_refund", target_id: refund.id, details: patch });
    return { refund };
  }
  const refund = { id: `irs-${Date.now()}`, created_at: new Date().toISOString(), email: emailOf(String(input.user_id)), ...patch };
  state.irsRefunds.unshift(refund);
  await writeAudit({ action: "irs.create", target_type: "irs_refund", target_id: refund.id, details: patch });
  return { refund };
}

async function deleteIrsRefund(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing refund id.");
  state.irsRefunds = state.irsRefunds.filter((r) => r.id !== id);
  await writeAudit({ action: "irs.delete", target_type: "irs_refund", target_id: id });
  return { ok: true };
}

async function adminMemberships(search?: string, status?: string) {
  await requireAdmin();
  let rows = [...state.memberships].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (status) rows = rows.filter((m) => m.status === status);
  if (search) rows = rows.filter((m) => (m.email ?? "").toLowerCase().includes(search.trim().toLowerCase()));
  return { memberships: rows.slice(0, 200) };
}

async function saveMembership(input: { id?: string; user_id?: string; tier?: string; status?: string; ends_at?: string | null }) {
  await requireAdmin();
  let userId = input.user_id;
  if (input.id && !userId) {
    userId = state.memberships.find((m) => m.id === input.id)?.user_id;
  }
  if (!userId) throw new DbError("invalid_input", "Select a user for the membership.");
  const patch = {
    user_id: userId,
    tier: input.tier ?? "standard",
    status: input.status ?? "active",
    ends_at: input.ends_at ?? null,
  };
  if (input.id) {
    const membership = state.memberships.find((m) => m.id === input.id);
    if (!membership) throw new DbError("not_found", "Membership not found.", 404);
    Object.assign(membership, patch, { email: emailOf(String(patch.user_id)) });
    await writeAudit({ action: "membership.update", target_type: "membership", target_id: membership.id, details: patch });
    return { membership };
  }
  const membership = {
    id: `mem-${Date.now()}`,
    created_at: new Date().toISOString(),
    starts_at: new Date().toISOString(),
    email: emailOf(String(input.user_id)),
    ...patch,
  };
  state.memberships.unshift(membership);
  await writeAudit({ action: "membership.create", target_type: "membership", target_id: membership.id, details: patch });
  return { membership };
}

async function deleteMembership(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing membership id.");
  state.memberships = state.memberships.filter((m) => m.id !== id);
  await writeAudit({ action: "membership.delete", target_type: "membership", target_id: id });
  return { ok: true };
}

/* ------------------------------------------------------------------------- */
/* Mock: tickets + contact inbox                                             */
/* ------------------------------------------------------------------------- */

async function adminTickets(status?: string) {
  await requireAdmin();
  let rows = [...state.tickets].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (status) rows = rows.filter((t) => t.status === status);
  return {
    tickets: rows.slice(0, 200).map((t) => {
      const mine = state.ticketMessages
        .filter((m) => m.ticket_id === t.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return {
        id: t.id,
        subject: t.subject,
        category: t.category,
        status: t.status,
        created_at: t.created_at,
        email: emailOf(t.user_id),
        message_count: mine.length,
        last_message: mine[0]?.body ?? null,
        last_message_at: mine[0]?.created_at ?? t.created_at,
      };
    }),
  };
}

async function adminTicketDetail(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing ticket id.");
  const ticket = state.tickets.find((t) => t.id === id);
  if (!ticket) throw new DbError("not_found", "Ticket not found.", 404);
  return {
    ticket: { ...ticket, email: emailOf(ticket.user_id) },
    messages: state.ticketMessages
      .filter((m) => m.ticket_id === id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((m) => ({ id: m.id, body: m.body, from: m.sender, sender: m.sender === "support" ? "admin" : "user", created_at: m.created_at })),
  };
}

async function adminReplyTicket(id?: string, body?: string) {
  await requireAdmin();
  if (!id || !body?.trim()) throw new DbError("invalid_input", "Message body is required.");
  const ticket = state.tickets.find((t) => t.id === id);
  if (!ticket) throw new DbError("not_found", "Ticket not found.", 404);
  state.ticketMessages.push({
    id: `m-${Date.now()}`,
    ticket_id: id,
    sender: "support",
    body: body.trim(),
    created_at: new Date().toISOString(),
  });
  await writeAudit({ action: "ticket.reply", target_type: "ticket", target_id: id });
  return { ok: true };
}

async function setTicketStatus(input: { id?: string; status?: string }) {
  await requireAdmin();
  if (!input.id || !input.status) throw new DbError("invalid_request", "Missing ticket id or status.");
  if (!["open", "pending", "closed"].includes(input.status)) throw new DbError("invalid_status", "Unsupported status.");
  const ticket = state.tickets.find((t) => t.id === input.id);
  if (!ticket) throw new DbError("not_found", "Ticket not found.", 404);
  ticket.status = input.status;
  await writeAudit({ action: `ticket.${input.status}`, target_type: "ticket", target_id: input.id });
  return { ok: true };
}

async function deleteTicket(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing ticket id.");
  state.tickets = state.tickets.filter((t) => t.id !== id);
  state.ticketMessages = state.ticketMessages.filter((m) => m.ticket_id !== id);
  await writeAudit({ action: "ticket.delete", target_type: "ticket", target_id: id });
  return { ok: true };
}

async function adminContactMessages(handled?: string) {
  await requireAdmin();
  let rows = [...state.contactMessages].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (handled === "true") rows = rows.filter((m) => m.handled);
  if (handled === "false") rows = rows.filter((m) => !m.handled);
  return { messages: rows.slice(0, 200) };
}

async function setContactHandled(id?: string, handled?: boolean) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing message id.");
  const msg = state.contactMessages.find((m) => m.id === id);
  if (!msg) throw new DbError("not_found", "Message not found.", 404);
  msg.handled = handled ?? true;
  await writeAudit({ action: "contact.handled", target_type: "contact_message", target_id: id, details: { handled: handled ?? true } });
  return { ok: true };
}

/* ------------------------------------------------------------------------- */
/* Mock: withdrawal codes / payment methods / settings / faq / testimonials  */
/* ------------------------------------------------------------------------- */

async function generateWithdrawalCode(input: { id?: string }) {
  await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing withdrawal id.");
  const w = state.withdrawals.find((x) => x.id === input.id);
  if (!w) throw new DbError("not_found", "Withdrawal not found.", 404);
  if (w.status !== "pending") throw new DbError("invalid_state", "Only pending withdrawals can receive a confirmation code.");
  const code = generateNumericCode();
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + 60 * 60 * 1000);
  w.confirmation_code = code;
  w.confirmation_code_generated_at = generatedAt.toISOString();
  w.confirmation_code_expires_at = expiresAt.toISOString();
  w.confirmation_code_used_at = null;
  await writeAudit({
    action: "withdrawal.code_generated",
    target_type: "withdrawal",
    target_id: w.id,
    details: { amount: w.amount, expires_at: expiresAt.toISOString() },
  });
  return { ok: true, code, generated_at: generatedAt.toISOString(), expires_at: expiresAt.toISOString() };
}

async function ensurePaymentMethodsSeededMock() {
  if (state.paymentMethodsDb.length === 0) {
    state.paymentMethodsDb = paymentMethodsList.map((m, i) => ({
      ...m,
      instructions: null,
      enabled: true,
      sort_order: i * 10,
    }));
  }
}

async function adminPaymentMethods() {
  await requireAdmin();
  await ensurePaymentMethodsSeededMock();
  return { methods: [...state.paymentMethodsDb].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) };
}

async function savePaymentMethod(input: Partial<PaymentMethod> & { instructions?: string | null }) {
  await requireAdmin();
  await ensurePaymentMethodsSeededMock();
  if (!input.name?.trim()) throw new DbError("invalid_name", "Method name is required.");
  const patch = {
    name: input.name.trim(),
    type: (input.type === "withdrawal" ? "withdrawal" : "deposit") as "deposit" | "withdrawal",
    emoji: input.emoji || "💳",
    minimum: parseAmountInput(input.minimum) ?? 0,
    maximum: parseAmountInput(input.maximum) ?? 0,
    charges_amount: parseAmountInput(input.charges_amount) ?? 0,
    duration: input.duration ?? null,
    instructions: input.instructions ?? null,
    custom_fields: input.custom_fields ?? [],
    enabled: input.enabled ?? true,
    sort_order: typeof input.sort_order === "number" ? input.sort_order : 500,
  };
  if (input.id) {
    const m = state.paymentMethodsDb.find((x) => x.id === input.id);
    if (!m) throw new DbError("not_found", "Method not found.", 404);
    Object.assign(m, patch);
    await writeAudit({ action: "payment_method.update", target_type: "payment_method", target_id: m.id });
    return { method: m };
  }
  const type = patch.type === "withdrawal" ? "withdraw" : "deposit";
  const slug = patch.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 28) || "method";
  const method = { ...patch, id: `${type}_${slug}_${Date.now().toString(36).slice(-4)}` };
  state.paymentMethodsDb.push(method);
  await writeAudit({ action: "payment_method.create", target_type: "payment_method", target_id: method.id });
  return { method };
}

async function deletePaymentMethod(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing method id.");
  state.paymentMethodsDb = state.paymentMethodsDb.filter((m) => m.id !== id);
  await writeAudit({ action: "payment_method.delete", target_type: "payment_method", target_id: id });
  return { ok: true };
}

async function getSiteSettings() {
  await requireAdmin();
  return {
    site: state.site,
    contact: state.siteSettings.get("contact") ?? {},
    live_chat: { provider: "builtin", enabled: false, key: "", ...(state.siteSettings.get("live_chat") ?? {}) } as Record<string, unknown>,
    security: (state.siteSettings.get("security") ?? {}) as Record<string, unknown>,
    features: (state.siteSettings.get("features") ?? {}) as Record<string, unknown>,
    email: (state.siteSettings.get("email") ?? {}) as Record<string, unknown>,
  };
}

async function updateSiteSettings(input: { group?: string; value?: Record<string, unknown> }) {
  await requireAdmin();
  if (!input.group || !input.value || typeof input.value !== "object") {
    throw new DbError("invalid_input", "Missing settings group or value.");
  }
  if (input.group === "general") {
    const s = { ...state.site } as unknown as Record<string, unknown>;
    if (typeof input.value.name === "string" && input.value.name.trim()) s.name = input.value.name.trim();
    if (typeof input.value.brand_color === "string" && input.value.brand_color.trim()) s.brand_color = input.value.brand_color.trim();
    if ("logo_url" in input.value) s.logo_url = (input.value.logo_url as string) || null;
    Object.assign(state.site, s);
  } else if (["contact", "live_chat", "security", "features", "email"].includes(input.group)) {
    state.siteSettings.set(input.group, input.value);
  } else {
    throw new DbError("invalid_group", "Unknown settings group.");
  }
  await writeAudit({ action: "settings.update", target_type: "settings", target_id: input.group });
  return { ok: true };
}

async function publicSiteSettings() {
  return {
    name: state.site.name,
    brand_color: state.site.brand_color,
    logo_url: null as string | null | undefined,
    contact: (state.siteSettings.get("contact") ?? {}) as Record<string, unknown>,
    live_chat: {
      provider: "builtin",
      enabled: false,
      key: "",
      position: "bottom-right",
      offset_bottom: 96,
      welcome_message: "Hi! How can we help you today?",
      title: "Live support",
      dashboard_only: true,
      custom_code: "",
      ...(state.siteSettings.get("live_chat") ?? {}),
    } as {
      provider: string;
      enabled: boolean;
      key: string;
      position: string;
      offset_bottom: number;
      welcome_message: string;
      title: string;
      dashboard_only: boolean;
      custom_code: string;
    },
    features: (state.siteSettings.get("features") ?? {}) as Record<string, unknown>,
  };
}

interface MockGrantProgram {
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

const mockGrantPrograms: MockGrantProgram[] = [];

async function publicGrantPrograms() {
  return { programs: mockGrantPrograms.filter((p) => p.enabled) };
}

async function adminGrantPrograms() {
  await requireAdmin();
  return { programs: [...mockGrantPrograms].sort((a, b) => a.sort_order - b.sort_order) };
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
    ? input.bullets.map(String)
    : String(input.bullets ?? "").split("\n").map((b) => b.trim()).filter(Boolean);
  const patch = {
    title,
    description: String(input.description ?? ""),
    icon: String(input.icon ?? "fa-solid fa-hand-holding-dollar"),
    tint: String(input.tint ?? "blue"),
    bullets,
    max_amount: input.max_amount ?? null,
    sort_order: Number(input.sort_order ?? 0) || 0,
    enabled: input.enabled !== false,
  };
  const existing = input.id ? mockGrantPrograms.find((p) => p.id === input.id) : null;
  if (existing) Object.assign(existing, patch);
  else mockGrantPrograms.push({ id: `gp-${Date.now()}`, ...patch });
  return { ok: true };
}

async function deleteGrantProgram(id?: string) {
  await requireAdmin();
  const index = mockGrantPrograms.findIndex((p) => p.id === id);
  if (index >= 0) mockGrantPrograms.splice(index, 1);
  return { ok: true };
}

async function adminFaqs() {
  await requireAdmin();
  return { faqs: [...state.faqs].sort((a, b) => a.sort_order - b.sort_order) };
}

async function saveFaq(input: Partial<FaqRow>) {
  await requireAdmin();
  if (!input.question?.trim() || !input.answer?.trim()) throw new DbError("invalid_input", "Question and answer are required.");
  const patch = {
    question: input.question.trim(),
    answer: input.answer.trim(),
    sort_order: typeof input.sort_order === "number" ? input.sort_order : 100,
    enabled: input.enabled ?? true,
  };
  if (input.id) {
    const faq = state.faqs.find((f) => f.id === input.id);
    if (!faq) throw new DbError("not_found", "FAQ not found.", 404);
    Object.assign(faq, patch);
    await writeAudit({ action: "faq.update", target_type: "faq", target_id: faq.id });
    return { faq };
  }
  const faq = { id: `faq-${Date.now()}`, created_at: new Date().toISOString(), ...patch };
  state.faqs.push(faq);
  await writeAudit({ action: "faq.create", target_type: "faq", target_id: faq.id });
  return { faq };
}

async function deleteFaq(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing FAQ id.");
  state.faqs = state.faqs.filter((f) => f.id !== id);
  await writeAudit({ action: "faq.delete", target_type: "faq", target_id: id });
  return { ok: true };
}

async function adminTestimonials() {
  await requireAdmin();
  return { testimonials: [...state.testimonials].sort((a, b) => b.created_at.localeCompare(a.created_at)) };
}

async function saveTestimonial(input: Partial<TestimonialRow>) {
  await requireAdmin();
  if (!input.author?.trim() || !input.quote?.trim()) throw new DbError("invalid_input", "Author and quote are required.");
  const rating = Math.min(5, Math.max(1, Number(input.rating ?? 5)));
  const patch = {
    author: input.author.trim(),
    role: input.role?.trim() || null,
    quote: input.quote.trim(),
    rating,
    enabled: input.enabled ?? true,
  };
  if (input.id) {
    const t = state.testimonials.find((x) => x.id === input.id);
    if (!t) throw new DbError("not_found", "Testimonial not found.", 404);
    Object.assign(t, patch);
    await writeAudit({ action: "testimonial.update", target_type: "testimonial", target_id: t.id });
    return { testimonial: t };
  }
  const t = { id: `tes-${Date.now()}`, created_at: new Date().toISOString(), ...patch };
  state.testimonials.unshift(t);
  await writeAudit({ action: "testimonial.create", target_type: "testimonial", target_id: t.id });
  return { testimonial: t };
}

async function deleteTestimonial(id?: string) {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing testimonial id.");
  state.testimonials = state.testimonials.filter((t) => t.id !== id);
  await writeAudit({ action: "testimonial.delete", target_type: "testimonial", target_id: id });
  return { ok: true };
}

async function publicFaqs() {
  return {
    faqs: state.faqs
      .filter((f) => f.enabled)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
  };
}

/* ------------------------------------------------------------------------- */
/* Mock: broadcast / crypto assets / storage                                  */
/* ------------------------------------------------------------------------- */

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
  const segment = input.segment ?? "all";
  const ids = (input.user_ids ?? []).map(String).filter(Boolean);
  let count = 0;
  for (const u of state.users.values()) {
    if (ids.length > 0 && !ids.includes(u.id)) continue;
    if (ids.length === 0 && segment === "active" && u.status !== "active") continue;
    if (ids.length === 0 && segment === "inactive" && !["suspended", "disabled"].includes(u.status)) continue;
    if (ids.length === 0 && segment === "email_verified" && !u.email_verified_at) continue;
    if (ids.length === 0 && segment === "email_unverified" && u.email_verified_at) continue;
    if (ids.length === 0 && segment === "kyc_verified" && u.kyc_status !== "verified") continue;
    if (ids.length === 0 && segment === "kyc_in_review" && u.kyc_status !== "in_review") continue;
    state.notifications.push({
      id: `n-${Date.now()}-${count}`,
      user_id: u.id,
      title: input.title.trim(),
      body: input.body.trim(),
      link: input.link?.trim() || null,
      icon: null,
      read_at: null,
      created_at: new Date().toISOString(),
    });
    count++;
  }
  await writeAudit({
    action: "broadcast.send",
    target_type: "notification",
    details: { recipients: count, segment },
  });
  return {
    ok: true,
    recipients: count,
    emailed: 0,
    segment: (ids.length > 0 ? `${count} selected member(s)` : segment) as string,
  };
}

async function adminCryptoAssets(search?: string) {
  await requireAdmin();
  const rows = state.crypto.filter((c) => {
    if (!search) return true;
    const term = search.trim().toLowerCase();
    return c.symbol.toLowerCase().includes(term) || (emailOf(c.user_id) ?? "").toLowerCase().includes(term);
  });
  return {
    assets: rows.map((c) => ({ ...c, email: emailOf(c.user_id) })),
  };
}

async function setCryptoAsset(input: { id?: string; balance?: number | string; price_usd?: number | string }) {
  await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing asset id.");
  const asset = state.crypto.find((c) => c.id === input.id);
  if (!asset) throw new DbError("not_found", "Asset not found.", 404);
  const balance = parseAmountInput(input.balance);
  const price = parseAmountInput(input.price_usd);
  if (balance !== null && balance >= 0) asset.balance = String(balance);
  if (price !== null && price >= 0) asset.price_usd = String(price);
  await writeAudit({ action: "crypto_asset.update", target_type: "crypto_asset", target_id: input.id, details: { balance: asset.balance, price_usd: asset.price_usd } });
  return { ok: true };
}

async function adminStorageAssets() {
  await requireAdmin();
  return { files: [], total_folders: 0 };
}

async function deleteStorageAsset(_path?: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  throw new DbError("not_available", "Storage browsing requires the live backend.", 400);
}

/** Admin re-issues the confirmation code for a pending transfer. */
async function generateTransferCode(input: { id?: string }): Promise<{
  ok: boolean;
  code: string;
  generated_at: string;
  expires_at: string;
}> {
  await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing transfer id.");
  const tx = state.transactions.find((t) => t.id === input.id && t.kind === "transfer");
  if (!tx) throw new DbError("not_found", "Transfer not found.", 404);
  if (tx.status !== "pending")
    throw new DbError("invalid_state", "Only pending transfers can receive a confirmation code.");
  const record = transferCodes.get(String(input.id));
  if (record?.used_at)
    throw new DbError("code_already_used", "This transfer was already confirmed with a code.");
  const code = generateNumericCode();
  const expires = Date.now() + 60 * 60 * 1000;
  transferCodes.set(String(input.id), { code, expires_at: expires, used_at: null });
  await writeAudit({
    action: "transfer.code_generated",
    target_type: "transaction",
    target_id: String(input.id),
  });
  return {
    ok: true,
    code,
    generated_at: new Date().toISOString(),
    expires_at: new Date(expires).toISOString(),
  };
}

/** Permanently remove one transaction record (admin only). */
async function adminDeleteTransaction(id?: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!id) throw new DbError("invalid_request", "Missing transaction id.");
  const tx = state.transactions.find((t) => t.id === id);
  if (!tx) throw new DbError("not_found", "Transaction not found.", 404);
  state.transactions = state.transactions.filter((t) => t.id !== id);
  await writeAudit({
    action: "transaction.delete",
    target_type: "transaction",
    target_id: id,
    target_label: emailOf(tx.user_id),
    details: { kind: tx.kind, amount: tx.amount },
  });
  return { ok: true };
}

async function startImpersonation(input: { id?: string }) {
  const actor = await requireAdmin();
  if (!input.id) throw new DbError("invalid_request", "Missing user id.");
  const target = state.users.get(input.id);
  if (!target) throw new DbError("not_found", "User not found.", 404);
  if (target.role === "admin") throw new DbError("forbidden", "Admin accounts cannot be impersonated.", 403);
  if (target.status === "disabled") throw new DbError("account_disabled", "This account is disabled.");
  const store = await cookies();
  store.set("bimp_1", signImpersonationValue(target.id), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 2,
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

async function endImpersonation() {
  const store = await cookies();
  const bimp = store.getAll().find((c) => c.name.startsWith("bimp_"));
  const targetId = verifyImpersonationValue(bimp?.value);
  if (bimp && targetId) {
    const t = state.users.get(targetId);
    let actor: UserRow | null = null;
    try { actor = await requireSession(); } catch { actor = null; }
    await writeAudit({
      action: "impersonation.end",
      target_type: "user",
      target_id: targetId,
      target_label: t?.email,
      details: { admin_email: actor?.role === "admin" ? actor.email : null },
    });
  }
  store.getAll()
    .filter((c) => c.name.startsWith("bimp_"))
    .forEach((c) => store.delete(c.name));
  return { ok: true };
}

export const db = {
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
  cancelWithdrawal,
  cancelTransfer,
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
  adminGrantPrograms,
  saveGrantProgram,
  deleteGrantProgram,
  publicGrantPrograms,
  setGrantStatus,
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
  adminDeleteTransaction,
  startImpersonation,
  endImpersonation,
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