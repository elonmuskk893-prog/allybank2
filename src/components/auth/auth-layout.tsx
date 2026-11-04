"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoadingOrbits } from "@/components/auth/loading-orbits";
import { useTheme } from "@/components/theme-provider";

export interface AuthFeature {
  icon: string;
  title: string;
  sub: string;
}

export interface AuthPanelContent {
  title: string;
  subtitle?: string;
  desc: string;
  features: AuthFeature[];
}

import { cn } from "@/lib/utils";
import { useSite } from "@/lib/use-site";

interface AuthLayoutProps {
  /** Content for the left showcase panel. */
  left: AuthPanelContent;
  /** Site name used for the brand initial badge. */
  brand?: string;
  /** Brand color. */
  color?: string;
  /** Max width of the right form column (default "max-w-sm"). */
  rightMax?: string;
  /** Form area rendered on the right side. */
  children: ReactNode;
}

/**
 * Shared split-screen layout for auth pages (login, admin login, register).
 * Left: animated brand showcase. Right: form. Shows a brand loader overlay
 * on first paint, matching the original site.
 */
export function AuthLayout({
  left,
  brand,
  color,
  rightMax = "max-w-sm",
  children,
}: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { site, loading } = useSite();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const brandColor = color ?? site?.brand_color ?? "#0ea5e9";
  const siteName = brand ?? site?.name ?? "";
  const logoUrl = site?.logo_url;
  const initial = (siteName || "B").slice(0, 1);

  return (
    <main
      className="relative min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
      style={{ "--brand": brandColor } as React.CSSProperties}
    >
      {isLoading && (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <LoadingOrbits brand={brandColor} className="mx-auto mb-6" />
            <div
              className="bg-clip-text text-lg font-bold tracking-wide text-transparent"
              style={{
                backgroundImage: `linear-gradient(90deg, ${brandColor}, #6366f1, ${brandColor})`,
                backgroundSize: "200% auto",
                animation: "auth-shimmer 3s linear infinite",
              }}
            >
              {siteName || "Loading"}
            </div>
            <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Online Account Platform
            </div>
          </div>
        </div>
      )}

      <button
        aria-label="Toggle theme"
        onClick={toggleTheme}
        suppressHydrationWarning
        className="absolute right-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-full bg-white/70 text-gray-600 shadow-sm backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
      >
        <i className={`fa-solid ${theme === "dark" ? "fa-sun text-yellow-500" : "fa-gear"}`} />
      </button>

      <div className="flex min-h-screen flex-col lg:flex-row">
        <LeftPanel
          left={left}
          brand={initial}
          color={brandColor}
          logoUrl={logoUrl}
          siteName={siteName}
        />

        <div className="flex w-full flex-col items-center justify-center bg-gray-50/50 p-3 backdrop-blur-sm dark:bg-gray-900/50 lg:w-1/2 lg:p-8">
          <div className={cn("w-full", rightMax)}>
            <MobileBrandHeader
              brand={initial}
              left={left}
              color={brandColor}
              logoUrl={logoUrl}
              siteName={siteName}
            />
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

function LeftPanel({
  left,
  brand,
  color,
  logoUrl,
  siteName,
}: {
  left: AuthPanelContent;
  brand: string;
  color: string;
  logoUrl?: string;
  siteName?: string;
}) {
  return (
    <div
      className="relative hidden overflow-hidden lg:flex lg:w-1/2"
      style={{ background: `linear-gradient(150deg, ${color}, rgba(0,0,0,0.55))` }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="auth-float-slow absolute left-1/4 top-1/4 h-48 w-48 rounded-full bg-white/10 backdrop-blur-sm" />
        <div className="auth-float absolute bottom-1/3 right-1/4 h-72 w-72 rounded-full bg-white/5 backdrop-blur-sm" />
        <div className="auth-float-slower absolute left-1/3 top-2/3 h-32 w-32 rounded-full bg-white/[0.15] backdrop-blur-sm" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "25px 25px",
          }}
        />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-8 text-white">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-white/20 blur-lg" />
          <div className="relative rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <BrandBadge brand={brand} color={color} logoUrl={logoUrl} size="h-12" />
          </div>
        </div>

        <h1 className="mb-3 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-center text-3xl font-black text-transparent">
          {left.title}
        </h1>
        <h2 className="mb-6 text-center text-lg font-semibold text-white/90">
          {left.subtitle ?? siteName}
        </h2>
        <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-white/80">
          {left.desc}
        </p>

        <div className="grid w-full max-w-md grid-cols-2 gap-4">
          {left.features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: AuthFeature }) {
  return (
    <div className="group flex items-center space-x-3 rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.15]">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/20 transition-transform group-hover:scale-110">
        <i className={`${feature.icon} text-sm`} />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{feature.title}</h3>
        <p className="text-xs text-white/70">{feature.sub}</p>
      </div>
    </div>
  );
}

function MobileBrandHeader({
  brand,
  left,
  color,
  logoUrl,
  siteName,
}: {
  brand: string;
  left: AuthPanelContent;
  color: string;
  logoUrl?: string;
  siteName?: string;
}) {
  return (
    <div className="mb-6 mt-10 text-center lg:hidden">
      <div className="relative mb-3 inline-block">
        <div className="absolute inset-0 rounded-2xl blur-lg" style={{ background: `${color}33` }} />
        <div className="relative rounded-2xl border border-gray-200/50 bg-white/90 p-3 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/90">
          <BrandBadge brand={brand} color={color} logoUrl={logoUrl} size="h-10" />
        </div>
      </div>
      <h1 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
        {left.title}
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {left.subtitle ?? siteName}
      </p>
    </div>
  );
}

function BrandBadge({
  brand,
  color,
  logoUrl,
  size,
}: {
  brand: string;
  color: string;
  logoUrl?: string;
  size: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={brand}
        className={`${size} aspect-square rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`grid ${size} aspect-square place-items-center rounded-full text-base font-bold text-white`}
      style={{ background: color }}
    >
      {brand || "B"}
    </span>
  );
}