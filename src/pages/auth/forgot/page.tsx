"use client";

import { useState } from "react";
import { useRouter } from "@/lib/next/navigation";
import Link from "@/lib/next/link";
import { AuthLayout, type AuthPanelContent } from "@/components/auth/auth-layout";
import { AuthInput } from "@/components/auth/auth-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { bankFetch } from "@/lib/api";

const FORGOT_PANEL: AuthPanelContent = {
  title: "Password Recovery",
  subtitle: "Forgot Your Password?",
  desc: "Secure access to your account with our simple password recovery process.",
  features: [
    { icon: "fas fa-shield-alt", title: "Secure Recovery", sub: "Safe process" },
    { icon: "fas fa-key", title: "Email Verification", sub: "Code delivery" },
    { icon: "fas fa-clock", title: "Quick Process", sub: "Fast recovery" },
    { icon: "fas fa-user-shield", title: "Account Protection", sub: "Data security" },
  ],
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await bankFetch<{ dev_code?: string }>("/auth/forgot", {
      method: "POST",
      body: { email },
    });
    if (!result.ok) {
      setLoading(false);
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setLoading(false);
    // When email delivery is unavailable the API returns the code directly so
    // recovery never dead-ends; it is forwarded to the reset screen.
    const code = result.data?.dev_code ? `&code=${encodeURIComponent(result.data.dev_code)}` : "";
    router.replace(`/auth/reset?email=${encodeURIComponent(email)}${code}`);
  }

  return (
    <AuthLayout left={FORGOT_PANEL}>
      <div className="overflow-hidden rounded-2xl border border-gray-200/50 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/90">
        <div className="mb-5 text-center">
          <div
            className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: "color-mix(in srgb, var(--brand) 14%, transparent)" }}
          >
            <i className="fas fa-envelope text-2xl" style={{ color: "var(--brand)" }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reset Your Password</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Enter your email and we&apos;ll send you a 6-digit reset code
          </p>
        </div>
        <form onSubmit={onSubmit}>
          <AuthInput
            label="Email Address"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            disabled={loading}
            placeholder="name@email.com"
          />
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}
          <SubmitButton loading={loading}>
            <i className="fas fa-paper-plane text-sm" />
            Send Reset Code
          </SubmitButton>
          <Link
            href="/auth/login"
            className="mt-3 flex w-full items-center justify-center rounded-xl border border-gray-200/50 bg-gray-100/80 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-200/80 dark:border-gray-600/50 dark:bg-gray-700/80 dark:text-gray-200"
          >
            <i className="fas fa-arrow-right-to-bracket mr-2 text-sm" />
            Return to Login
          </Link>
        </form>
      </div>
      <p className="mt-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} -- All Rights Reserved.
      </p>
    </AuthLayout>
  );
}