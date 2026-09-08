"use client";

import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Banknote,
  Bitcoin,
  Coins,
  CreditCard,
  Crown,
  FileUp,
  Gift,
  HandCoins,
  Headset,
  HelpCircle,
  IdCard,
  Image,
  Inbox,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  ScrollText,
  Settings,
  Share2,
  Sliders,
  Star,
  Sun,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { adminFetch, bankFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

interface AdminContextValue {
  slug: string;
  siteName: string;
  siteLogo: string;
  brandColor: string;
  primaryCurrency: string;
  isSuper: boolean;
  permissions: Set<string>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminShell>");
  return ctx;
}

interface AdminSiteInfo {
  site: { slug: string; name?: string; brand_color?: string; primary_currency?: string; logo_url?: string | null };
}

interface AdminMeData {
  site?: { name?: string; primary_currency?: string };
  admin?: { permissions?: string[]; is_super?: boolean };
}

interface NavItem {
  href: string;
  label: string;
  perm: string;
  Icon: ComponentType<{ className?: string }>;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Overview", perm: "super", Icon: LayoutDashboard }],
  },
  {
    title: "People",
    items: [
      { href: "/admin/users", label: "Users", perm: "users", Icon: Users },
      { href: "/admin/kyc", label: "KYC", perm: "kyc", Icon: IdCard },
      { href: "/admin/leads", label: "Leads", perm: "crm", Icon: UserPlus },
      { href: "/admin/tasks", label: "Tasks", perm: "crm", Icon: ListTodo },
      { href: "/admin/referrals", label: "Referrals", perm: "referrals", Icon: Share2 },
      { href: "/admin/import", label: "Import", perm: "users", Icon: FileUp },
    ],
  },
  {
    title: "Money",
    items: [
      { href: "/admin/deposits", label: "Deposits", perm: "deposits", Icon: ArrowDownToLine },
      { href: "/admin/withdrawals", label: "Withdrawals", perm: "withdrawals", Icon: ArrowUpFromLine },
      { href: "/admin/transfers", label: "Transfers", perm: "withdrawals", Icon: ArrowLeftRight },
      { href: "/admin/payment-methods", label: "Payment Methods", perm: "deposits", Icon: CreditCard },
      { href: "/admin/cards", label: "Cards", perm: "cards", Icon: Banknote },
      { href: "/admin/card-settings", label: "Card setup", perm: "card_settings", Icon: Sliders },
      { href: "/admin/currencies", label: "Currencies", perm: "currencies", Icon: Coins },
      { href: "/admin/loans", label: "Loans", perm: "loans", Icon: HandCoins },
      { href: "/admin/grants", label: "Grants", perm: "grants", Icon: Gift },
      { href: "/admin/irs-refunds", label: "IRS", perm: "irs", Icon: Landmark },
      { href: "/admin/memberships", label: "Membership", perm: "memberships", Icon: Crown },
    ],
  },
  {
    title: "Trading",
    items: [
      { href: "/admin/crypto-assets", label: "Crypto", perm: "crypto", Icon: Bitcoin },
    ],
  },
  {
    title: "Engage",
    items: [
      { href: "/admin/live-chat", label: "Live chat", perm: "contact_inbox", Icon: Headset },
      { href: "/admin/contact-messages", label: "Inbox", perm: "contact_inbox", Icon: Inbox },
      { href: "/admin/tickets", label: "Support tickets", perm: "contact_inbox", Icon: LifeBuoy },
      { href: "/admin/broadcast", label: "Broadcast", perm: "broadcast", Icon: Megaphone },
      { href: "/admin/testimonials", label: "Testimonials", perm: "content", Icon: Star },
    ],
  },
  {
    title: "Site",
    items: [
      { href: "/admin/assets", label: "Assets", perm: "appearance", Icon: Image },
      { href: "/admin/faq", label: "FAQ", perm: "content", Icon: HelpCircle },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/audit-log", label: "Audit log", perm: "audit", Icon: ScrollText },
      { href: "/admin/settings", label: "Settings", perm: "super", Icon: Settings },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";
  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      suppressHydrationWarning
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/[0.06] bg-white/60 text-gray-600 transition-colors hover:bg-white/90 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [ctx, setCtx] = useState<AdminContextValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    (async () => {
      const info = await bankFetch<AdminSiteInfo>("/site-info");
      if (!info.ok || !info.data?.site) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const slug = info.data.site.slug;
      const me = await adminFetch<AdminMeData>(slug, "/me");
      if (!me.ok) {
        if (me.status === 401) {
          router.replace("/admin/login");
          return;
        }
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (!me.data?.site) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCtx({
        slug,
        siteLogo: info.data.site.logo_url || "/allybank.jpeg",
        siteName: me.data.site.name ?? info.data.site.name ?? slug,
        brandColor: info.data.site.brand_color || "#0ea5e9",
        primaryCurrency: me.data.site.primary_currency ?? info.data.site.primary_currency ?? "USD",
        permissions: new Set(me.data.admin?.permissions ?? []),
        isSuper: Boolean(me.data.admin?.is_super),
      });
      setLoading(false);
      const unreadRes = await adminFetch<{ count: number }>(slug, "/unread-count");
      if (unreadRes.ok && unreadRes.data) setUnread(unreadRes.data.count);
    })();
  }, [router]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (ctx) await adminFetch(ctx.slug, "/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  if (notFound) {
    return (
      <main className="grid min-h-screen place-items-center bg-gray-50 px-6 text-center dark:bg-gray-900">
        <div>
          <div className="text-6xl font-extrabold tracking-tight text-gray-300 dark:text-gray-700">404</div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">This page isn&apos;t available.</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"
          >
            Go to home
          </Link>
        </div>
      </main>
    );
  }

  if (loading || !ctx) {
    return (
      <main className="grid min-h-screen place-items-center bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </main>
    );
  }

  const brand = ctx.brandColor;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

  const currentLabel = ALL_ITEMS.find((item) => isActive(item.href))?.label ?? "Admin";

  const filteredGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => ctx.isSuper || ctx.permissions.has(i.perm)),
  })).filter((g) => g.items.length > 0);

  const renderBrand = () => (
    <Link href="/admin" className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- platform logo asset */}
      <img
        src={ctx.siteLogo}
        alt={ctx.siteName}
        className="h-10 w-10 rounded-xl object-cover"
      />
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold tracking-tight text-gray-900 dark:text-white">
          {ctx.siteName}
        </span>
        <span
          className="block text-[10px] font-bold uppercase tracking-wider"
          style={{ color: brand }}
        >
          {ctx.isSuper ? "Admin console" : "Sub-admin"}
        </span>
      </span>
    </Link>
  );

  const renderNav = () => (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
      {filteredGroups.map((group) => (
        <div key={group.title}>
          <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {group.title}
          </h3>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
                  )}
                  style={active ? { background: brand } : undefined}
                >
                  <item.Icon className="h-[17px] w-[17px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.href === "/admin/chat" && unread > 0 && (
                    <span className="ml-auto shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const renderLogout = () => (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
    >
      <LogOut className="h-[17px] w-[17px]" />
      Log out
    </button>
  );

  return (
    <AdminContext.Provider value={ctx}>
      <div
        className="flex min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
        style={{ "--brand": brand } as React.CSSProperties}
      >
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200/70 bg-white dark:border-gray-800 dark:bg-gray-900 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="border-b border-gray-200/70 p-5 dark:border-gray-800">
          {renderBrand()}
        </div>
        {renderNav()}
        <div className="border-t border-gray-200/70 p-3 dark:border-gray-800">
          {renderLogout()}
        </div>
      </aside>

      <div className="flex min-h-screen w-full flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                {currentLabel}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span
                className="hidden rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:inline-block"
                style={{ background: brand }}
              >
                {ctx.isSuper ? "Super admin" : "Sub-admin"}
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[82vw] flex-col border-r border-gray-200/70 bg-white transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between border-b border-gray-200/70 p-4 dark:border-gray-800">
          {renderBrand()}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {renderNav()}
        <div className="border-t border-gray-200/70 p-3 dark:border-gray-800">
          {renderLogout()}
        </div>
      </aside>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      </div>
    </AdminContext.Provider>
  );
}