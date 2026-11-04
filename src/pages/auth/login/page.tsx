"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/next/navigation";
import Link from "@/lib/next/link";
import { AuthLayout, type AuthPanelContent } from "@/components/auth/auth-layout";
import { bankFetch } from "@/lib/api";
import { useSite } from "@/lib/use-site";

const LOGIN_PANEL: AuthPanelContent = {
  title: "Welcome Back",
  desc: "Sign in to review your account, transfers and recent activity.",
  features: [
    { icon: "fas fa-shield-alt", title: "Account security", sub: "Hashed passwords" },
    { icon: "fas fa-bolt", title: "Transfers", sub: "Status tracking" },
    { icon: "fas fa-globe", title: "Account Tools", sub: "Feature availability varies" },
    { icon: "fas fa-mobile-screen", title: "Browser Access", sub: "Desktop and mobile" },
  ],
};

interface LoginResponse {
  needs_2fa?: boolean;
  needs_email_verification?: boolean;
  pin_gate?: boolean;
}

interface LoginErrorBody {
  allow_proceed?: boolean;
  account_status?: string;
  message?: string;
  label?: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { site } = useSite();
  const justRegistered = searchParams.get("registered") === "1";
  const justVerified = searchParams.get("verified") === "1";
  const siteName = site?.name ?? "your account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restricted, setRestricted] = useState<LoginErrorBody | null>(null);

  // If already authenticated, head straight to the dashboard.
  useEffect(() => {
    bankFetch("/me").then((res) => {
      if (res.ok) router.replace("/dashboard");
    });
  }, [router]);

  async function handleLogin(acknowledge: boolean) {
    setError(null);
    setLoading(true);
    const result = await bankFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password, ...(acknowledge ? { acknowledge: true } : {}) },
    });
    setLoading(false);

    if (!result.ok) {
      if (result.errorCode === "account_restricted" && result.errorBody?.allow_proceed) {
        const body = result.errorBody as LoginErrorBody;
        setRestricted({
          message: body.message ?? undefined,
          label: String(body.account_status ?? "").replace(/-/g, " "),
        });
        return;
      }
      if (result.errorCode === "account_blocked") {
        setError(result.error ?? "This account is blocked. Please contact support.");
        return;
      }
      if (result.errorCode === "email_not_confirmed") {
        const pendingEmail = String(result.errorBody?.email ?? email).trim();
        router.replace(`/auth/verify-email?email=${encodeURIComponent(pendingEmail)}`);
        return;
      }
      setError(
        result.errorCode === "invalid_credentials"
          ? "Email or password is incorrect."
          : (result.error ?? "Login failed"),
      );
      return;
    }

    if (result.data?.needs_2fa) return router.replace("/auth/2fa");
    if (result.data?.needs_email_verification) {
      const hint = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
        ? `?email=${encodeURIComponent(email.trim())}`
        : "";
      return router.replace(`/auth/verify-email${hint}`);
    }
    if (result.data?.pin_gate) return router.replace("/pin");
    router.replace("/dashboard");
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    handleLogin(false);
  }

  if (restricted) {
    return (
      <AuthLayout left={LOGIN_PANEL}>
        <div className="overflow-hidden rounded-2xl border border-amber-200/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-amber-700/40 dark:bg-gray-800/90">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
              <i className="fa-solid fa-triangle-exclamation text-lg text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Account {restricted.label || "restricted"}
            </h2>
          </div>
          <p className="rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            {restricted.message ||
              "Your account currently has a restriction. You can continue, but some features may be limited. Please contact support if you need help."}
          </p>
          <button
            type="button"
            onClick={() => handleLogin(true)}
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60"
            style={{ background: "linear-gradient(to right, var(--brand), rgba(0,0,0,0.25))" }}
          >
            {loading ? (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <i className="fas fa-arrow-right mr-2 text-sm" />
            )}
            Continue anyway
          </button>
          <button
            type="button"
            onClick={() => {
              setRestricted(null);
              setPassword("");
            }}
            className="mt-3 w-full text-center text-xs font-medium text-gray-500 hover:opacity-80 dark:text-gray-400"
          >
            Cancel
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout left={LOGIN_PANEL}>
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200/50 bg-red-50/90 p-3 text-red-700 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-300">
          <i className="fas fa-exclamation-circle mt-0.5 text-sm text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200/50 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/90">
        <div className="border-b border-gray-100/50 px-6 pb-4 pt-6 dark:border-gray-700/50">
          <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Sign In</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Access your {siteName} account
          </p>
        </div>

        {justRegistered && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <i className="fa-solid fa-circle-check mt-0.5" />
            <span>Account created successfully. Sign in to get started.</span>
          </div>
        )}
        {justVerified && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <i className="fa-solid fa-circle-check mt-0.5" />
            <span>Email verified successfully. Sign in to continue.</span>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4 px-6 pb-6 pt-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Email Address or Username
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-gray-400">
                <i className="fas fa-envelope text-sm" />
              </span>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-gray-300/50 bg-gray-50/50 py-3 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:ring-2 dark:border-gray-600/50 dark:bg-gray-700/50 dark:text-gray-100"
                style={{ "--tw-ring-color": "var(--brand)" } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Password
              </label>
              <Link
                href="/auth/forgot"
                className="text-xs font-medium hover:opacity-80"
                style={{ color: "var(--brand)" }}
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-gray-400">
                <i className="fas fa-lock text-sm" />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-gray-300/50 bg-gray-50/50 py-3 pl-10 pr-12 text-sm text-gray-900 outline-none transition focus:ring-2 dark:border-gray-600/50 dark:bg-gray-700/50 dark:text-gray-100"
                style={{ "--tw-ring-color": "var(--brand)" } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
                className="absolute inset-y-0 right-0 z-10 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`} />
              </button>
            </div>
          </div>

          <div className="flex items-center pt-1">
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="rounded border-gray-300/50"
                style={{ accentColor: "var(--brand)" }}
              />
              <span className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                Keep me signed in
              </span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60"
              style={{ background: "linear-gradient(to right, var(--brand), rgba(0,0,0,0.25))" }}
            >
              {loading ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <i className="fas fa-sign-in-alt mr-2 text-sm" />
              )}
              Sign In to Account
            </button>
          </div>

          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200/50 dark:border-gray-700/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white/90 px-3 font-medium text-gray-500 dark:bg-gray-800/90 dark:text-gray-400">
                New to {site?.name ?? "us"}?
              </span>
            </div>
          </div>

          <Link
            href="/auth/register"
            className="flex w-full items-center justify-center rounded-xl border border-gray-200/50 bg-gray-100/80 px-4 py-3 text-sm font-semibold text-gray-800 backdrop-blur-sm transition hover:scale-[1.02] hover:bg-gray-200/80 dark:border-gray-600/50 dark:bg-gray-700/80 dark:text-gray-200 dark:hover:bg-gray-600/80"
          >
            <i className="fas fa-user-plus mr-2 text-sm" />
            Create New Account
          </Link>
        </form>
      </div>

      <div className="mt-6 space-y-3 text-center">
        <div className="flex flex-wrap items-center justify-center space-x-4 text-xs">
          <Link href="/contact" className="flex items-center font-medium text-gray-600 transition hover:opacity-80 dark:text-gray-400">
            <i className="fas fa-shield-alt mr-1 text-xs" />
            Security
          </Link>
          <Link href="/contact" className="flex items-center font-medium text-gray-600 transition hover:opacity-80 dark:text-gray-400">
            <i className="fas fa-headset mr-1 text-xs" />
            Support
          </Link>
          <Link href="/terms" className="flex items-center font-medium text-gray-600 transition hover:opacity-80 dark:text-gray-400">
            <i className="fas fa-file-contract mr-1 text-xs" />
            Terms
          </Link>
        </div>
        <p className="mx-auto max-w-xs text-xs leading-relaxed text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy. Your data is
          protected with an encrypted connection.
        </p>
      </div>
    </AuthLayout>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
