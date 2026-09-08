import type {
  Balance,
  Beneficiary,
  Card,
  CryptoAsset,
  Deposit,
  NotificationItem,
  Session,
  Transaction,
  Withdrawal,
} from "@/lib/types";

/**
 * Static mock data used by the API route handlers while the real backend is
 * being built. Replace the route handlers in `app/api` with real logic and
 * delete this folder when the backend is ready.
 */

export const SITE = {
  id: 1,
  slug: "teslamodel",
  name: "Tesla Model",
  brand_color: "#0ea5e9",
  primary_currency: "USD",
  kyc_required: true,
};

export const ADMIN_SESSION_COOKIE = "admin_session";

export const MOCK_USER = {
  id: 1001,
  email: "alex.morgan@example.com",
  first_name: "Alex",
  last_name: "Morgan",
  photo_url: "",
  account_number: "4023391234",
  status: "active",
  kyc_status: "verified" as const,
  email_verified_at: new Date().toISOString(),
};

export function mockSession(): Session {
  return { site: SITE, user: MOCK_USER };
}

export const MOCK_BALANCES: Balance[] = [
  { currency: "USD", amount: 84250.75 },
  { currency: "EUR", amount: 12400.0 },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 1, kind: "deposit", amount: 2500, status: "completed", created_at: "2026-08-18T10:24:00Z" },
  { id: 2, kind: "transfer-out", amount: 1200, status: "completed", created_at: "2026-08-17T15:02:00Z" },
  { id: 3, kind: "card-spend", amount: 87.45, status: "completed", created_at: "2026-08-16T12:41:00Z" },
  { id: 4, kind: "admin-credit", amount: 5000, status: "completed", created_at: "2026-08-15T09:00:00Z" },
  { id: 5, kind: "plan-roi", amount: 342.18, status: "completed", created_at: "2026-08-14T08:00:00Z" },
  { id: 6, kind: "withdrawal", amount: 900, status: "pending", created_at: "2026-08-13T18:30:00Z" },
];

export const MOCK_CARDS: Card[] = [
  {
    id: 1,
    card_brand: "visa",
    card_number_masked: "•••• 4128",
    expires_at: "2028-05-01T00:00:00Z",
    balance: 3200,
    currency: "USD",
    status: "active",
  },
  {
    id: 2,
    card_brand: "mastercard",
    card_number_masked: "•••• 7761",
    expires_at: "2027-11-01T00:00:00Z",
    balance: 540.25,
    currency: "USD",
    status: "active",
  },
];

export const MOCK_BENEFICIARIES: Beneficiary[] = [
  { id: 1, name: "Emma Wilson", favorite: true },
  { id: 2, name: "Daniel Park", favorite: true },
  { id: 3, name: "Sophia Chen" },
  { id: 4, name: "Liam Garcia" },
];

export const MOCK_DEPOSITS: Deposit[] = [
  { id: 1, status: "completed", amount: 2500 },
  { id: 2, status: "pending", amount: 800 },
];

export const MOCK_WITHDRAWALS: Withdrawal[] = [
  { id: 1, status: "sent", amount: 900 },
];

export const MOCK_CRYPTO_ASSETS: CryptoAsset[] = [
  { symbol: "BTC", name: "Bitcoin", mock_rate_usd: 61500 },
  { symbol: "ETH", name: "Ethereum", mock_rate_usd: 3400 },
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: "Deposit received",
    body: "$2,500.00 was credited to your account.",
    created_at: "2026-08-18T10:24:00Z",
    read_at: null,
  },
  {
    id: 2,
    title: "New card issued",
    body: "Your new Visa card is ready to use.",
    created_at: "2026-08-16T12:00:00Z",
    read_at: new Date().toISOString(),
  },
];