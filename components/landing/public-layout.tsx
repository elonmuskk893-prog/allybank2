"use client";

import type { ReactNode } from "react";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/footer";
import { MobileAuthBar } from "@/components/landing/mobile-auth-bar";

/** Shared shell for public (marketing) pages: header + content + footer. */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
      style={{ "--brand": "#0ea5e9" } as React.CSSProperties}
    >
      <LandingHeader />
      {children}
      <LandingFooter />
      <MobileAuthBar />
    </div>
  );
}