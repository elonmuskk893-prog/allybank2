"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/next/navigation";
import { AuthLayout, type AuthPanelContent } from "@/components/auth/auth-layout";
import { AuthInput } from "@/components/auth/auth-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { bankFetch } from "@/lib/api";

const RESET_PANEL: AuthPanelContent = {
  title: "Set a New Password",
  subtitle: "Almost there",
  desc: "Use the code we emailed you to choose a new, secure password for your account.",
  features: [
    { icon: "fas fa-shield-alt", title: "Secure Recovery", sub: "Safe process" },
    { icon: "fas fa-key", title: "Verified Code", sub: "One-time use" },
    { icon: "fas fa-clock", title: "Quick Process", sub: "Fast recovery" },
    { icon: "fas fa-user-shield", title: "Account Protection", sub: "Data security" },
  ],
};

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const justSent = searchParams.get("sent") === "1";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(120);

  async function resend() {
    if (resending || resendIn > 0) return;
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setResending(true);
    setError(null);
    setMessage(null);
    const result = await bankFetch("/auth/forgot", {
      method: "POST",
      body: { email: email.trim() },
    });
    setResending(false);
    if (!result.ok) {
      setError(result.error ?? "Could not resend. Please try again.");
      return;
    }
    setMessage("If that email is registered, a new code is on its way.");
    setResendIn(120);
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const result = await bankFetch("/auth/reset", {
      method: "POST",
      body: { email, code, password },
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
    router.replace("/auth/login");
  }

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const countdown = `${Math.floor(resendIn / 60)}:${String(resendIn % 60).padStart(2, "0")}`;

  return (
    <AuthLayout left={RESET_PANEL}>
      <div className="overflow-hidden rounded-2xl border border-gray-200/50 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/90">
        <div className="mb-5 text-center">
          <div
            className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: "color-mix(in srgb, var(--brand) 14%, transparent)" }}
          >
            <i className="fas fa-lock text-2xl" style={{ color: "var(--brand)" }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Set a new password</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Use the code we emailed you.
          </p>
        </div>
        <form onSubmit={updatePassword} className="space-y-4 px-6 pb-6 pt-4">
          {justSent && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-sky-200/60 bg-sky-50 p-3 text-xs text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300">
            <i className="fa-solid fa-circle-info mt-0.5" />
            <span>
              We&apos;ve emailed a 6-digit reset code to your address. Enter it below with your new
              password. The code expires in 15 minutes and can only be used once.
            </span>
          </div>
        )}
          <AuthInput
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            disabled={loading}
          />
          <AuthInput
            label="Reset code"
            value={code}
            onChange={setCode}
            disabled={loading}
            placeholder="123456"
          />
          <AuthInput
            label="New password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            disabled={loading}
            error={error ?? undefined}
          />
          <SubmitButton loading={loading}>
            <i className="fas fa-rotate-right text-sm" />
            Update password
          </SubmitButton>
        </form>
        {message && (
          <p className="mt-3 text-center text-xs text-green-600 dark:text-green-400">{message}</p>
        )}
        <button
          type="button"
          onClick={resend}
          disabled={resending || resendIn > 0}
          className="mt-4 w-full text-center text-xs text-gray-600 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400"
        >
          {resending
            ? "Sending…"
            : resendIn > 0
              ? `Resend code in ${countdown}`
              : "Didn't get the code? Resend"}
        </button>
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}