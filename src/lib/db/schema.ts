/** Shared database row shapes used by the data layer. */

export interface Site {
  id: number;
  slug: string;
  name: string;
  brand_color: string;
  primary_currency: string;
  kyc_required: boolean;
  logo_url?: string | null;
}

export interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  photo_url: string | null;
  phone: string | null;
  country: string | null;
  currency: string;
  role: "user" | "admin";
  status: "active" | "suspended" | "disabled" | "blocked" | "restricted";
  kyc_status: "pending" | "in_review" | "verified" | "rejected" | "not_submitted";
  kyc_required: boolean;
  email_verified_at: string | null;
  pin_gate: boolean;
  pin_hash: string | null;
  account_number: string | null;
  referral_code: string | null;
  twofa_enabled: boolean;
  mask_payment_details?: boolean | null;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  currency: string;
  balance: string;
  available: string;
  account_number: string | null;
  status: "active" | "frozen" | "closed";
}

export interface TransactionRow {
  id: string;
  user_id: string;
  account_id: string | null;
  kind: string;
  direction: "credit" | "debit";
  amount: string;
  currency: string;
  name: string | null;
  reference: string | null;
  status: string;
  fee: string;
  balance_after: string | null;
  created_at: string;
}

export interface CardRow {
  id: string;
  user_id: string;
  brand: string;
  card_type: string;
  last4: string;
  holder: string;
  expiry: string;
  status: string;
  limit_amount: string | null;
  spent: string;
  frozen: boolean;
  created_at: string;
}

export interface BeneficiaryRow {
  id: string;
  user_id: string;
  name: string;
  bank: string | null;
  account_number: string | null;
  routing: string | null;
  email: string | null;
  currency: string;
  nickname: string | null;
  created_at: string;
  kind?: "local" | "international" | "crypto" | string;
  favorite?: boolean;
  bank_name?: string | null;
  swift?: string | null;
  account_type?: string | null;
  routing_number?: string | null;
  country?: string | null;
  bank_address?: string | null;
  iban?: string | null;
  crypto_currency?: string | null;
  used_count?: number;
  last_used_at?: string | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  icon: string | null;
  read_at: string | null;
  created_at: string;
}

export interface DepositRow {
  id: string;
  user_id: string;
  method: string;
  amount: string;
  currency: string;
  reference: string | null;
  status: string;
  created_at: string;
}

export interface WithdrawalRow {
  id: string;
  user_id: string;
  method: string;
  amount: string;
  currency: string;
  account_number: string | null;
  reference: string | null;
  status: string;
  created_at: string;
  method_id?: string | null;
  destination?: Record<string, unknown> | null;
  custom?: Record<string, string> | null;
  otp_verified_at?: string | null;
  admin_note?: string | null;
}

export interface CryptoAssetRow {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  balance: string;
  price_usd: string | null;
  created_at: string;
}

export interface LoanRow {
  id: string;
  user_id: string;
  amount: string;
  interest_rate: string;
  term_months: number | null;
  status: string;
  created_at: string;
}

export interface GrantRow {
  id: string;
  user_id: string;
  program: string;
  amount: string | null;
  status: string;
  created_at: string;
}

export interface SettingsRow {
  user_id: string;
  language: string;
  currency: string;
  notifications: Record<string, unknown>;
  security: Record<string, unknown>;
  updated_at: string;
}

export interface CardApplicationRow {
  id: string;
  user_id: string;
  card_type: string;
  status: string;
  created_at: string;
}

export interface AdminCodeRow {
  id: string;
  user_id: string;
  code_hash: string;
  label: string;
  active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface TwofaCodeRow {
  id: string;
  user_id: string;
  code_hash: string;
  challenge: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface PasswordResetRow {
  id: string;
  email: string;
  code_hash: string;
  expires_at: string;
  created_at: string;
}

export interface EmailVerificationRow {
  id: string;
  user_id: string;
  email: string;
  code_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  admin_id: string | null;
  admin_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface LeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface AdminTaskRow {
  id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: string;
  status: string;
  due_at: string | null;
  created_at: string;
}

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

export interface IrsRefundRow {
  id: string;
  user_id: string;
  tax_year: number;
  amount: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface MembershipRow {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface SiteCurrencyRow {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rate: string;
  enabled: boolean;
  created_at: string;
}

/** Custom field rendered on deposit/withdrawal forms. */
export interface PaymentMethodCustomField {
  id: string;
  label: string;
  type: string;
  role?: "input" | "display";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  value?: string | null;
}

/** A deposit/withdrawal payment method shown to the user. */
export interface PaymentMethod {
  id: string;
  name: string;
  type: "deposit" | "withdrawal";
  emoji?: string;
  minimum?: number | string | null;
  maximum?: number | string | null;
  charges_amount?: number | string | null;
  charges_type?: "percent" | "fixed";
  duration?: string | null;
  instructions?: string | null;
  enabled?: boolean;
  sort_order?: number;
  custom_fields?: PaymentMethodCustomField[];
}

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  enabled: boolean;
  created_at: string;
}

export interface TestimonialRow {
  id: string;
  author: string;
  role: string | null;
  quote: string;
  rating: number;
  enabled: boolean;
  created_at: string;
}

/** A support ticket created by a user. */
export interface SupportTicketRow {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | string;
  created_at: string;
}

/** A message inside a support ticket. */
export interface SupportMessageRow {
  id: string;
  ticket_id: string;
  sender: "user" | "support";
  body: string;
  created_at: string;
}

/** Full KYC record stored under settings.security.kyc. */
export interface KycRecord {
  id_type?: string;
  id_number?: string;
  doc_type?: string;
  doc_url?: string;
  doc_back_url?: string;
  selfie_url?: string;
  title?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  ssn?: string;
  account_type?: string;
  employer?: string;
  income?: string;
  nok_name?: string;
  nok_relationship?: string;
  nok_phone?: string;
  nok_address?: string;
  admin_note?: string;
}