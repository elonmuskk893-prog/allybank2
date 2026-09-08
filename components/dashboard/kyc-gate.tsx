"use client";

import type { ReactNode } from "react";
import { useMe } from "@/components/dashboard/app-shell";
import Link from "next/link";

interface KycGateProps {
  /** Verb used in the messaging, e.g. "transfer money". */
  action: string;
  children: ReactNode;
}

/**
 * Blocks restricted content until the member's identity is verified.
 * Mirrors the original gate: verified members pass through, everyone else
 * sees a brand-themed notice (pending / rejected states included).
 */
export function KycGate({ action, children }: KycGateProps) {
  const me = useMe();
  const brand = me.site.brand_color || "#0ea5e9";
  const status = me.user.kyc_status;

  // Administrators manage the platform and are never gated by customer KYC.
  if (!me.site.kyc_required || status === "verified" || me.user.role === "admin") {
    return <>{children}</>;
  }

  const pending = status === "pending";
  const rejected = status === "rejected";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-xl dark:border-gray-700/50 dark:bg-gray-800">
        <div
          className="relative overflow-hidden p-6 text-center text-white"
          style={{ background: `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.35))` }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
              <i className={`fa-solid ${pending ? "fa-clock" : "fa-lock"} text-2xl`} />
            </div>
            <h2 className="text-2xl font-bold">
              {pending ? "Verification in progress" : "Verify your identity first"}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-white/90">
              {pending
                ? `We're reviewing the details you sent. As soon as they're approved you'll be able to ${action}.`
                : `Before you can ${action}, we need to confirm it's really you.`}
            </p>
          </div>
        </div>
        <div className="space-y-4 p-6">
          {rejected && (
            <div className="rounded-xl border border-red-200/60 bg-red-50 p-4 text-sm text-red-800 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300">
              <p className="flex items-center gap-2 font-semibold">
                <i className="fa-solid fa-circle-xmark" /> Your last submission was sent back
              </p>
              <p className="mt-1">
                Open the verification form to see the reason, correct it, and resend.
              </p>
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pending
              ? "This usually takes a short while. You can still receive money, view your balance and check your transactions in the meantime."
              : "It takes a couple of minutes — some personal details and a photo of your ID. You can still receive money and view your account while you wait."}
          </p>
          {!pending && (
            <Link
              href="/settings/kyc"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01]"
              style={{ background: `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.25))` }}
            >
              <i className="fa-solid fa-id-card" />
              {rejected ? "Fix and resend" : "Verify my identity"}
            </Link>
          )}
          {pending && (
            <Link
              href="/settings/kyc"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/50"
            >
              Review what you sent
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}