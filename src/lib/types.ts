export interface SiteConfig {
  id: number;
  slug: string;
  name: string;
  brand_color?: string;
  logo_url?: string;
  primary_currency: string;
  kyc_required?: boolean;
}

export interface SessionUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  account_number?: string;
  status: string;
  kyc_status: "verified" | "pending" | "rejected" | "unverified";
  email_verified_at?: string | null;
  pin_gate?: boolean;
  role?: "admin" | "user" | string;
  mask_payment_details?: boolean;
}

export interface Session {
  site: SiteConfig;
  user: SessionUser;
  /** True when an administrator is viewing this account via impersonation. */
  impersonating?: boolean;
}

export interface Balance {
  currency: string;
  amount: string | number;
}

export interface Transaction {
  id: number | string;
  kind: string;
  amount: number | string;
  status?: string;
  created_at: string;
  meta?: { label?: string };
}

export interface Card {
  id: number | string;
  card_brand: "visa" | "mastercard";
  card_number_masked: string;
  expires_at?: string | null;
  balance: number | string;
  currency: string;
  status: string;
}

export interface Beneficiary {
  id: number | string;
  name: string;
  favorite?: boolean;
}

export interface Deposit {
  id: number | string;
  status: string;
  amount: number | string;
}

export interface Withdrawal {
  id: number | string;
  status: string;
  amount: number | string;
}

export interface CryptoAsset {
  symbol: string;
  name: string;
  mock_rate_usd?: number;
}

export interface NotificationItem {
  id: number | string;
  title?: string;
  body?: string;
  link?: string;
  read_at?: string | null;
  created_at?: string;
}