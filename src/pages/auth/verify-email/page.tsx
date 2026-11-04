"use client";

import { useEffect, useState } from "react";
import Link from "@/lib/next/link";
import { useRouter, useSearchParams } from "@/lib/next/navigation";
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
  const searchParams = useSearchParams();
  const sentFailed = searchParams.get("sent") === "0";

  const [email, setEmail] = useState(searchParams.get("email")?.trim() ?? "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    sentFailed ? "We couldn't send the first code — press “Resend code” below." : null,
  );
  const [resendIn, setResendIn] = useState(0);
  const [verified, setVerified] = useState(false);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your verification email.");
      return;
    }
    setLoading(true);
    const result = await bankFetch<{ already_verified?: boolean }>("/auth/verify-email", {
      method: "POST",
      body: { code: code.trim(), email: email.trim() || undefined },
    });
    setLoading(false);
    if (!result.ok) {
      if (result.errorCode === "too_many_attempts") {
        setError("Too many incorrect codes. Please wait a few minutes and try again.");
        return;
      }
      setError(
        result.errorCode === "invalid_or_expired_code"
          ? "That code is wrong or has expired. Request a new one below."
          : (result.error ?? "We couldn't verify that code. Please try again."),
      );
      return;
    }
    setVerified(true);
    setMessage("Email verified. Taking you to sign in…");
    window.setTimeout(() => router.replace("/auth/login?verified=1"), 1200);
  }

  async function handleResend() {
    if (resending || resendIn > 0) return;
    setResending(true);
    setError(null);
    setMessage(null);
    const result = await bankFetch<{ already_verified?: boolean; resend_in?: number }>(
      "/auth/resend-verify",
      { method: "POST", body: { email: email.trim() || undefined } },
    );
    setResending(false);
    if (!result.ok) {
      const wait = Number(result.errorBody?.resend_in ?? 0);
      if (result.errorCode === "too_many_requests") {
        if (wait > 0) setResendIn(wait);
        setError(result.error ?? "Please wait before requesting another code.");
        return;
      }
      setError(
        result.errorCode === "email_unavailable"
          ? "We couldn't send the email right now. Please try again shortly or contact support."
          : (result.error ?? "We couldn't send another code. Please try again."),
      );
      return;
    }
    if (result.data?.already_verified) {
      setMessage("This email is already verified. Taking you to sign in…");
      window.setTimeout(() => router.replace("/auth/login?verified=1"), 1200);
      return;
    }
    setMessage("A new code is on the way. Check your inbox and spam folder.");
    setResendIn(typeof result.data?.resend_in === "number" ? result.data.resend_in : 60);
  }

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    (async () => {
      const status = await bankFetch<{ resend_in?: number; verified?: boolean }>(
        "/auth/resend-verify-status",
      );
      if (!status.ok) return;
      if (status.data?.verified) {
        setMessage("This email is already verified. Taking you to sign in…");
        window.setTimeout(() => router.replace("/auth/login?verified=1"), 1200);
        return;
      }
      if (typeof status.data?.resend_in === "number" && status.data.resend_in > 0) {
        setResendIn(status.data.resend_in);
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
              className={`fas ${verified ? "fa-circle-check" : "fa-envelope-open-text"} text-2xl`}
              style={{ color: "var(--brand)" }}
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verify your email</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {email
              ? `Enter the 6-digit code we emailed to ${email}.`
              : "Enter your email address and the 6-digit code we sent you."}
          </p>
        </div>
        <form onSubmit={handleVerify}>
          <AuthInput
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            disabled={loading || verified}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <AuthInput
            label="Verification code"
            value={code}
            onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
            disabled={loading || verified}
            placeholder="123456"
            autoComplete="one-time-code"
            error={error ?? undefined}
          />
          {message && <p className="mb-3 text-xs text-green-600 dark:text-green-400">{message}</p>}
          <SubmitButton loading={loading}>
            <i className="fas fa-check text-sm" />
            Verify
          </SubmitButton>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendIn > 0 || verified}
            className="mt-4 w-full text-center text-xs text-gray-600 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400"
          >
            {resending
              ? "Sending…"
              : resendIn > 0
                ? `Resend code in ${countdown}`
                : "Didn't get it? Resend code"}
          </button>
          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            Already verified?{" "}
            <Link href="/auth/login" className="font-semibold text-[var(--brand)] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
