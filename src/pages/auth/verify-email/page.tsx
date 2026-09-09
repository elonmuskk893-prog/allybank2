"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout, type AuthPanelContent } from "@/components/auth/auth-layout";
import { AuthInput } from "@/components/auth/auth-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { bankFetch } from "@/lib/api";

const VERIFY_PANEL: AuthPanelContent = {
  title: "Verify Your Email",
  subtitle: "One last step",
  desc: "Confirm your email address with the 6-digit code we just sent so we know it's really you.",
  features: [
    { icon: "fas fa-envelope", title: "Email Verification", sub: "Code delivery" },
    { icon: "fas fa-shield-alt", title: "Secure", sub: "Protected sign-up" },
    { icon: "fas fa-clock", title: "Quick", sub: "Takes seconds" },
    { icon: "fas fa-circle-check", title: "Confirmed", sub: "Account ready" },
  ],
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const result = await bankFetch("/auth/verify-email", {
      method: "POST",
      body: { code },
    });
    setLoading(false);
    if (!result.ok) {
      setError(
        result.errorCode === "invalid_or_expired_code"
          ? "Code is wrong or expired."
          : (result.error ?? "Failed"),
      );
      return;
    }
    router.replace("/dashboard");
  }

  async function handleResend() {
    if (resending || resendIn > 0) return;
    setResending(true);
    setError(null);
    setMessage(null);
    const result = await bankFetch<{ already_verified?: boolean; resend_in?: number }>(
      "/auth/resend-verify",
      { method: "POST" },
    );
    setResending(false);
    if (!result.ok) {
      setError(result.error ?? "Failed");
      return;
    }
    if (result.data?.already_verified) {
      router.replace("/dashboard");
      return;
    }
    setMessage("A new code is on the way. Check your inbox.");
    setResendIn(
      typeof result.data?.resend_in === "number" ? result.data.resend_in : 120,
    );
  }

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    (async () => {
      const status = await bankFetch<{ resend_in?: number }>("/auth/resend-verify-status");
      if (status.ok && typeof status.data?.resend_in === "number") {
        setResendIn(status.data.resend_in);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const me = await bankFetch<{ user?: { email_verified_at?: string | null } }>("/me");
      if (me.ok && me.data?.user?.email_verified_at) {
        router.replace("/dashboard");
      }
    })();
  }, [router]);

  const countdown = `${Math.floor(resendIn / 60)}:${String(resendIn % 60).padStart(2, "0")}`;

  return (
    <AuthLayout left={VERIFY_PANEL}>
      <div className="overflow-hidden rounded-2xl border border-gray-200/50 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/90">
        <div className="mb-5 text-center">
          <div
            className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: "color-mix(in srgb, var(--brand) 14%, transparent)" }}
          >
            <i
              className="fas fa-envelope-open-text text-2xl"
              style={{ color: "var(--brand)" }}
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verify your email</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code we just emailed you.
          </p>
        </div>
        <form onSubmit={handleVerify}>
          <AuthInput
            label="Verification code"
            value={code}
            onChange={setCode}
            disabled={loading}
            placeholder="123456"
            error={error ?? undefined}
          />
          {message && (
            <p className="mb-3 text-xs text-green-600 dark:text-green-400">{message}</p>
          )}
          <SubmitButton loading={loading}>
            <i className="fas fa-check text-sm" />
            Verify
          </SubmitButton>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendIn > 0}
            className="mt-4 w-full text-center text-xs text-gray-600 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400"
          >
            {resending
              ? "Sending…"
              : resendIn > 0
                ? `Resend code in ${countdown}`
                : "Didn't get it? Resend code"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}