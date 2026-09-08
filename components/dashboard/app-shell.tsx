"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { bankFetch } from "@/lib/api";
import type { Session } from "@/lib/types";
import {
  DESKTOP_NAV,
  MOBILE_NAV,
  PAGE_TITLES,
  type NavItem,
} from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/dashboard/avatar";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import { UserMenu } from "@/components/dashboard/user-menu";
import { KycBanner } from "@/components/dashboard/kyc-banner";
import { KycNagModal } from "@/components/dashboard/kyc-nag-modal";
import { Toaster } from "sonner";
import Link from "next/link";

const SessionContext = createContext<Session | null>(null);

/** Access the authenticated session inside the dashboard shell. */
export function useMe(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useMe must be used inside <AppShell>");
  return session;
}

const KYC_STORAGE_PREFIX = "bank_kyc_nag:";

function clearKycStorage() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(KYC_STORAGE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors.
  }
}

/** Full-screen brand loader shown while the session is resolving. */
function FullScreenLoader({ brand, name }: { brand: string; name: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="relative mx-auto mb-8 h-28 w-28">
          <span
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{ borderTopColor: brand, animation: "ggl-orbit 2s linear infinite" }}
          />
          <span
            className="absolute inset-[12%] rounded-full border-2 border-transparent"
            style={{ borderBottomColor: brand, animation: "ggl-orbit 2.6s linear infinite reverse" }}
          />
          <span
            className="absolute inset-[24%] rounded-full border-2 border-transparent"
            style={{ borderTopColor: brand, animation: "ggl-orbit 3.2s linear infinite" }}
          />
          <span
            className="absolute left-1/2 top-1/2 h-5 w-5 rounded-full"
            style={{
              background: brand,
              boxShadow: `0 0 24px ${brand}`,
              animation: "ggl-core 2s ease-in-out infinite",
            }}
          />
        </div>
        <div
          className="bg-clip-text text-lg font-bold tracking-wide text-transparent"
          style={{
            backgroundImage: `linear-gradient(90deg, ${brand}, #6366f1, ${brand})`,
            backgroundSize: "200% auto",
            animation: "ggl-shimmer 3s linear infinite",
          }}
        >
          {name || "Loading"}
        </div>
        <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Secure Banking Platform
        </div>
      </div>
    </main>
  );
}

interface AppShellProps {
  children: ReactNode;
}

/** Authenticated application shell: sidebar, header, mobile nav, banners. */
export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const [me, setMe] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  const logoutUser = async () => {
    await bankFetch("/auth/logout", { method: "POST" });
    clearKycStorage();
    router.replace("/auth/login");
  };

  const logoutAdmin = async () => {
    // End the impersonation session server-side (clears the httpOnly cookie).
    if (me?.impersonating) {
      await bankFetch("/auth/impersonate", { method: "DELETE" });
    }
    clearKycStorage();
    router.replace("/admin");
  };

  useEffect(() => {
    (async () => {
      const result = await bankFetch<Session>("/me");
      if (result.ok && result.data) {
        if (result.data.user.pin_gate) {
          router.replace("/pin");
          return;
        }
        setMe(result.data);
        setImpersonating(Boolean(result.data.impersonating));
        setLoading(false);
        return;
      }
      router.replace("/auth/login");
    })();
  }, [router]);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [pathname]);



  const brand = me?.site.brand_color || "#0ea5e9";

  if (loading || !me) {
    return <FullScreenLoader brand={brand} name={me?.site.name ?? ""} />;
  }

  const fullName =
    [me.user.first_name, me.user.last_name].filter(Boolean).join(" ") ||
    me.user.email;

  const activePill = `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.22))`;

  const pageTitle =
    PAGE_TITLES[pathname] ??
    Object.keys(PAGE_TITLES).find((key) => pathname.startsWith(`${key}/`)) ??
    "Dashboard";

  const isActive = (item: NavItem) => {
    const target = item.match ?? item.href.split("#")[0];
    const excluded = item.except?.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    return !excluded && (pathname === target || pathname.startsWith(`${target}/`));
  };

  return (
    <SessionContext.Provider value={me}>
      <div
        className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
        style={{ "--brand": brand } as React.CSSProperties}
      >
        <div className="hidden h-screen lg:flex">
          <Sidebar
            brand={brand}
            siteName={me.site.name}
            logoUrl={me.site.logo_url}
            fullName={fullName}
            email={me.user.email}
            photoUrl={me.user.photo_url}
            isActive={isActive}
            onLogout={logoutUser}
          />
          <div className="flex flex-1 flex-col">
            <Header
              title={pageTitle}
              fullName={fullName}
              photoUrl={me.user.photo_url}
              email={me.user.email}
              brand={brand}
              userMenuOpen={userMenuOpen}
              setUserMenuOpen={setUserMenuOpen}
              me={me}
              onLogout={logoutUser}
            />
            <TopBars me={me} impersonating={impersonating} onExit={logoutAdmin} />
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              <div className="mx-auto w-full max-w-7xl px-6 py-6">{children}</div>
            </main>
          </div>
        </div>

        <div className="flex min-h-screen flex-col lg:hidden">
          {pathname !== "/dashboard" && (
            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200/50 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/80">
              <BrandLogo brand={brand} siteName={me.site.name} logoUrl={me.site.logo_url} />
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <NotificationsBell />
              </div>
            </header>
          )}
          <TopBars me={me} impersonating={impersonating} onExit={logoutAdmin} />
          <main className="flex-1 px-4 py-5 pb-28">{children}</main>

          <div className="fixed bottom-2 left-3 right-3 z-40">
            <div className="rounded-3xl border border-gray-200/50 bg-white/90 p-1.5 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/90">
              <div className="flex items-center justify-between">
                {MOBILE_NAV.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-xl px-0.5 py-2"
                    >
                      {active && (
                        <div
                          className="absolute inset-0 rounded-xl shadow-lg"
                          style={{ background: activePill }}
                        />
                      )}
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className={cn(
                            "mb-0.5 grid h-7 w-7 place-items-center rounded-lg",
                            active ? "bg-white/20" : "bg-gray-100 dark:bg-gray-800",
                          )}
                        >
                          <i
                            className={`${item.icon} text-sm ${
                              active ? "text-white" : "text-gray-500 dark:text-gray-400"
                            }`}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-[10px] leading-tight",
                            active
                              ? "font-semibold text-white"
                              : "font-medium text-gray-500 dark:text-gray-400",
                          )}
                        >
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <KycNagModal me={me} pathname={pathname} />
        <Toaster position="top-center" richColors closeButton />
      </div>
    </SessionContext.Provider>
  );
}

interface BrandLogoProps {
  brand: string;
  siteName: string;
  logoUrl?: string;
}

function BrandLogo({ brand, siteName, logoUrl }: BrandLogoProps) {
  return (
    <Link href="/dashboard" className="flex w-full items-center">
      {logoUrl ? (
        <span className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- external logo URL, parity requires plain img */}
          <img src={logoUrl} alt={siteName} className="h-11 w-11 rounded-full object-cover" />
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            {siteName}
          </span>
        </span>
      ) : (
        <span className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-full text-lg font-bold text-white"
            style={{ background: brand }}
          >
            {siteName.slice(0, 1)}
          </span>
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            {siteName}
          </span>
        </span>
      )}
    </Link>
  );
}

interface SidebarProps {
  brand: string;
  siteName: string;
  logoUrl?: string;
  fullName: string;
  email: string;
  photoUrl?: string;
  isActive: (item: NavItem) => boolean;
  onLogout: () => void;
}

function Sidebar({
  brand,
  siteName,
  logoUrl,
  fullName,
  email,
  photoUrl,
  isActive,
  onLogout,
}: SidebarProps) {
  const activePill = `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.22))`;

  return (
    <div className="flex w-72 flex-col border-r border-gray-200/50 bg-white/80 shadow-xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/80">
      <div className="border-b border-gray-200/50 p-6 dark:border-gray-700/50">
        <BrandLogo brand={brand} siteName={siteName} logoUrl={logoUrl} />
      </div>

      <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 py-6">
        {DESKTOP_NAV.map((group) => (
          <div key={group.title}>
            <h3 className="mb-4 px-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      active
                        ? "text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
                    )}
                    style={active ? { background: activePill } : undefined}
                  >
                    <span
                      className={cn(
                        "mr-4 grid h-10 w-10 place-items-center rounded-xl transition-colors",
                        active ? "bg-white/20" : "bg-gray-100 dark:bg-gray-800",
                      )}
                    >
                      <i
                        className={`${item.icon} ${
                          active ? "text-white" : "text-gray-500 dark:text-gray-400"
                        }`}
                      />
                    </span>
                    <span className="font-semibold">{item.label}</span>
                    {active && <span className="ml-auto h-2 w-2 rounded-full bg-white" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200/50 p-4 dark:border-gray-700/50">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100 p-4 dark:border-gray-700/50 dark:from-gray-800 dark:to-gray-700">
          <div className="relative">
            <Avatar
              url={photoUrl}
              name={fullName}
              brand={brand}
              className="h-10 w-10 rounded-full border-2 border-white"
            />
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-gray-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
              {fullName}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{email}</p>
          </div>
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="grid h-8 w-8 place-items-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          >
            <i className="fa-solid fa-right-from-bracket text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface HeaderProps {
  title: string;
  fullName: string;
  photoUrl?: string;
  email: string;
  brand: string;
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;
  me: Session;
  onLogout: () => void;
}

function Header({
  title,
  fullName,
  photoUrl,
  email,
  brand,
  userMenuOpen,
  setUserMenuOpen,
  me,
  onLogout,
}: HeaderProps) {
  return (
    <header className="relative z-50 border-b border-gray-200/50 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/80">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back, {fullName}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <NotificationsBell />
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Avatar
                url={photoUrl}
                name={fullName}
                brand={brand}
                className="h-10 w-10 rounded-full border-2 border-white"
              />
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
              </div>
              <i className="fa-solid fa-chevron-down text-sm text-gray-400 dark:text-gray-500" />
            </button>
            {userMenuOpen && (
              <UserMenu
                me={me}
                brand={brand}
                onLogout={onLogout}
                onClose={() => setUserMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

interface TopBarsProps {
  me: Session;
  impersonating: boolean;
  onExit: () => void;
}

function TopBars({ me, impersonating, onExit }: TopBarsProps) {
  return (
    <>
      <KycBanner me={me} />
      {!me.user.email_verified_at && me.user.role !== "admin" && (
        <div className="bg-amber-500/10 text-amber-700 dark:text-amber-200">
          <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs sm:px-6">
            <span>Your email isn&apos;t verified yet.</span>
            <Link
              href="/auth/verify-email"
              className="font-semibold underline-offset-2 hover:underline"
            >
              Verify now →
            </Link>
          </div>
        </div>
      )}
      {impersonating && (
        <div className="text-white" style={{ background: me.site.brand_color || "#0ea5e9" }}>
          <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs sm:px-6">
            <span>
              Admin preview -- viewing as{" "}
              <strong>{me.user.first_name ?? me.user.email}</strong>.
            </span>
            <button onClick={onExit} className="font-semibold underline-offset-2 hover:underline">
              Exit to admin →
            </button>
          </div>
        </div>
      )}
    </>
  );
}