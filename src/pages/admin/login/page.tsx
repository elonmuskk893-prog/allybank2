"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/next/navigation";
import { AuthLayout, type AuthPanelContent } from "@/components/auth/auth-layout";
import { AuthInput } from "@/components/auth/auth-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { adminFetch, bankFetch, errorMessage } from "@/lib/api";

const ADMIN_PANEL: AuthPanelContent = {
  title: "Admin Console",
  subtitle: "Operator access",
  desc: "Manage your banking site -- users, deposits, withdrawals, cards and more -- from one secure console.",
  features: [
    { icon: "fas fa-shield-halved", title: "Secure Access", sub: "Code or password" },
    { icon: "fas fa-users-gear", title: "Full Control", sub: "Users & money" },
    { icon: "fas fa-chart-line", title: "Live Overview", sub: "Real-time" },
    { icon: "fas fa-lock", title: "Protected", sub: "2FA optional" },
  ],
};

type LoginMethod = "email_password";

interface Challenge {
  challenge: string;
  via: "email" | "totp";
}

interface SiteInfo {
  site: {
    slug: string;
    name: string;
  };
}

interface LoginResponse {
  twofa?: "email" | "totp";
  challenge?: string;
}

function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [slug, setSlug] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("");
  const [loginMethod] = useState<LoginMethod>("email_password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strip a `code` query param (used by some email magic-link flows) from the URL.
  useEffect(() => {
    if (!searchParams.get("code")) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [searchParams]);

  // Bootstrap: resolve the site, skip if already authenticated, resolve login method.
  useEffect(() => {
    (async () => {
      const info = await bankFetch<SiteInfo>("/site-info");
      if (!info.ok || !info.data?.site) {
        setError(
          info.errorCode === "service_disabled"
            ? "This service is temporarily unavailable. Please check back shortly."
            : "This page is not configured for any banking site.",
        );
        return;
      }

      const { slug: siteSlug, name } = info.data.site;
      setSlug(siteSlug);
      setSiteName(name);

      const me = await adminFetch(siteSlug, "/me");
      if (me.ok) {
        router.replace("/admin");
        return;
      }

      const method = await adminFetch<{ method: LoginMethod }>(siteSlug, "/login-method");
      setLoginMethod(method.ok && method.data ? method.data.method : "auth_code");
    })();
  }, [router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!slug) return;

    setError(null);
    setLoading(true);

    const credentials =
      loginMethod === "email_password"
        ? { email, password }
        : { code };

    const result = await adminFetch<LoginResponse>(slug, "/login", {
      method: "POST",
      body: credentials,
    });

    setLoading(false);

    if (result.ok) {
      if (result.data?.twofa && result.data.challenge) {
        setChallenge({
          challenge: result.data.challenge,
          via: result.data.twofa,
        });
        return;
      }
      router.replace("/admin");
      return;
    }

    setError(errorMessage(result.errorCode, result.error));
  };

  const handleTwoFa = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!slug || !challenge) return;

    setError(null);
    setLoading(true);

    const result = await adminFetch(slug, "/login/2fa", {
      method: "POST",
      body: { challenge: challenge.challenge, code: twoFaCode },
    });

    setLoading(false);

    if (!result.ok) {
      if (result.errorCode === "challenge_expired") {
        setError("That took too long -- please sign in again.");
        setChallenge(null);
        setTwoFaCode("");
        return;
      }
      setError(
        result.errorCode === "invalid_code"
          ? "That code is wrong."
          : result.error ?? "Verification failed.",
      );
      return;
    }

    router.replace("/admin");
  };

  const methodUnknown = loginMethod === null && !error;
  const formHeading = siteName ? `${siteName} admin` : "Admin sign-in";
  const formSubtitle = challenge
    ? challenge.via === "totp"
      ? "Enter the 6-digit code from your authenticator app."
      : "Enter the 6-digit code we just emailed you."
    : loginMethod === "email_password"
      ? "Sign in with your admin email and password."
      : "Paste the master auth code from your dashboard.";

  return (
    <AuthLayout left={ADMIN_PANEL} brand={siteName}>
      <div className="overflow-hidden rounded-2xl border border-gray-200/50 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/90">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {formHeading}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {formSubtitle}
          </p>
        </div>

        {challenge ? (
          <form onSubmit={handleTwoFa}>
            <AuthInput
              label="Verification code"
              value={twoFaCode}
              onChange={setTwoFaCode}
              disabled={loading}
              placeholder="000000"
              autoComplete="one-time-code"
              error={error ?? undefined}
            />
            <SubmitButton loading={loading}>
              <i className="fas fa-shield-halved text-sm" />
              {" Verify"}
            </SubmitButton>
            <button
              type="button"
              onClick={() => {
                setChallenge(null);
                setTwoFaCode("");
                setError(null);
              }}
              className="mt-3 w-full text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Back
            </button>
          </form>
        ) : loginMethod === "email_password" ? (
          <form onSubmit={handleLogin}>
            <AuthInput
              label="Admin email"
              type="email"
              value={email}
              onChange={setEmail}
              disabled={loading}
              placeholder="you@example.com"
              autoComplete="username"
            />
            <AuthInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              disabled={loading}
              autoComplete="current-password"
              error={error ?? undefined}
            />
            <SubmitButton loading={loading} disabled={!slug}>
              <i className="fas fa-sign-in-alt text-sm" />
              {" Sign in"}
            </SubmitButton>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <AuthInput
              label="Admin auth code"
              value={code}
              onChange={setCode}
              disabled={loading || methodUnknown}
              placeholder="48-char hex"
              error={error ?? undefined}
            />
            <SubmitButton loading={loading} disabled={!slug}>
              <i className="fas fa-sign-in-alt text-sm" />
              {" Sign in"}
            </SubmitButton>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={null}>
      <AdminLoginPage />
    </Suspense>
  );
}