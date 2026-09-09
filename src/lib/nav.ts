export interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Path segment that also counts as active (e.g. transfer tabs). */
  match?: string;
  /** Paths that should NOT be highlighted for this item. */
  except?: string[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Desktop sidebar navigation groups. */
export const DESKTOP_NAV: NavGroup[] = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "fa-solid fa-house" },
      { href: "/transactions", label: "Transactions", icon: "fa-solid fa-chart-line" },
      { href: "/cards", label: "Cards", icon: "fa-solid fa-credit-card" },
    ],
  },
  {
    title: "Transfers",
    items: [
      { href: "/transfer", label: "Transfer", icon: "fa-solid fa-paper-plane", match: "/transfer" },
      { href: "/deposit", label: "Deposit", icon: "fa-solid fa-plus" },
      { href: "/crypto/swap", label: "Currency Swap", icon: "fa-solid fa-arrows-rotate" },
    ],
  },
  {
    title: "Services",
    items: [
      { href: "/loans", label: "Loans", icon: "fa-solid fa-landmark" },
      { href: "/irs-refunds", label: "Tax Refund", icon: "fa-solid fa-receipt" },
      { href: "/grants", label: "Grants", icon: "fa-solid fa-hand-holding-dollar" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/settings/kyc", label: "Verify Identity", icon: "fa-solid fa-id-card" },
      { href: "/referrals", label: "Refer & Earn", icon: "fa-solid fa-user-plus" },
      { href: "/notifications", label: "Notifications", icon: "fa-solid fa-bell" },
      { href: "/settings", label: "Settings", icon: "fa-solid fa-gear", except: ["/settings/kyc"] },
      { href: "/support", label: "Support", icon: "fa-solid fa-headset" },
    ],
  },
];

/** Mobile bottom navigation items. */
export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "fa-solid fa-house" },
  { href: "/transfer", label: "Transfer", icon: "fa-solid fa-paper-plane" },
  { href: "/deposit", label: "Deposit", icon: "fa-solid fa-plus" },
  { href: "/transactions", label: "Activity", icon: "fa-solid fa-chart-line" },
  { href: "/settings", label: "Settings", icon: "fa-solid fa-gear", except: ["/settings/kyc"] },
  { href: "/support", label: "Support", icon: "fa-solid fa-headset" },
];

/** Mobile "More" sheet groups. */
export const MORE_SHEET_NAV: NavGroup[] = [
  {
    title: "Services",
    items: [
      { href: "/cards", label: "Cards", icon: "fa-solid fa-credit-card" },
      { href: "/crypto/swap", label: "Currency Swap", icon: "fa-solid fa-arrows-rotate" },
      { href: "/loans", label: "Loans", icon: "fa-solid fa-landmark" },
      { href: "/irs-refunds", label: "Tax Refund", icon: "fa-solid fa-receipt" },
      { href: "/grants", label: "Grants", icon: "fa-solid fa-hand-holding-dollar" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/settings/kyc", label: "Verify Identity", icon: "fa-solid fa-id-card" },
      { href: "/referrals", label: "Refer & Earn", icon: "fa-solid fa-user-plus" },
      { href: "/notifications", label: "Notifications", icon: "fa-solid fa-bell" },
    ],
  },
];

/** Header page title for a given pathname. */
export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/cards": "Cards",
  "/transfer": "Transfer",
  "/deposit": "Deposit",
  "/withdraw": "Withdraw",
  "/crypto/swap": "Currency Swap",
  "/crypto/history": "Swap History",
  "/loans": "Loans",
  "/irs-refunds": "Tax Refund",
  "/grants": "Grants",
  "/settings/kyc": "Verify Identity",
  "/settings": "Settings",
  "/support": "Support",
  "/contact": "Support",
  "/beneficiaries": "Beneficiaries",
  "/referrals": "Refer & Earn",
  "/notifications": "Notifications",
  "/wallet": "Wallets",
  "/plans": "Trading Plans",
  "/my-plans": "My Plans",
  "/signals": "Trade Signals",
  "/membership": "Membership",
  "/copy-trading": "Copy Trading",
  "/courses": "Education",
  "/my-courses": "My Courses",
};