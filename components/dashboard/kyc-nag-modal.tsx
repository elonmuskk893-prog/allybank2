"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/lib/types";
import { needsKyc } from "@/lib/kyc";
import Link from "next/link";

interface KycNagModalProps {
  me: Session;
  pathname: string;
}

const STORAGE_PREFIX = "bank_kyc_nag:";

/**
 * Full-screen modal encouraging the user to complete KYC. Only shows once per
 * session and is suppressed on the KYC page itself.
 */
export function KycNagModal({ me, pathname }: KycNagModalProps) {
  const [visible, setVisible] = useState(false);

  const status = me.user.kyc_status;
  const shouldShow =
    needsKyc(me) && status !== "pending" && pathname !== "/settings/kyc";
  const storageKey = `${STORAGE_PREFIX}${me.site.id}:${me.user.id}`;

  const dismiss = () => {
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Ignore storage errors.
    }
    setVisible(false);
  };

  useEffect(() => {
    if (!shouldShow) {
      setVisible(false);
      return;
    }
    let suppressed = false;
    try {
      suppressed = sessionStorage.getItem(storageKey) === "1";
    } catch {
      // Ignore storage errors.
    }
    if (!suppressed) setVisible(true);
  }, [shouldShow, storageKey]);

  if (!visible) return null;

  const brand = me.site.brand_color || "#0ea5e9";
  const rejected = status === "rejected";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={dismiss} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kyc-nag-title"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/20 bg-white shadow-2xl dark:border-gray-700/50 dark:bg-gray-800"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
        >
          <i className="fa-solid fa-xmark" />
        </button>

        <div
          className="relative overflow-hidden p-6 text-center text-white"
          style={{ background: `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.35))` }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
              <i className={`fa-solid ${rejected ? "fa-circle-exclamation" : "fa-id-card"} text-2xl`} />
            </div>
            <h2 id="kyc-nag-title" className="text-xl font-bold">
              {rejected ? "Your verification needs fixing" : "Verify your identity"}
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-sm text-white/90">
              {rejected
                ? "We sent your last submission back. Correct it and resend to unlock your account."
                : `Welcome back${me.user.first_name ? `, ${me.user.first_name}` : ""} — before you can move money we need to confirm it's really you.`}
            </p>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            It takes a couple of minutes — some personal details and a photo of your ID.
            You can still receive money, view your balance and check your transactions
            in the meantime.
          </p>
          <Link
            href="/settings/kyc"
            onClick={dismiss}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01]"
            style={{ background: `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.25))` }}
          >
            <i className="fa-solid fa-id-card" />
            {rejected ? "Fix and resend" : "Verify now"}
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="w-full rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
          >
            I&apos;ll do it later
          </button>
        </div>
      </div>
    </div>
  );
}