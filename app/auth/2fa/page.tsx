"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout, type AuthPanelContent } from "@/components/auth/auth-layout";
import { AuthInput } from "@/components/auth/auth-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { bankFetch } from "@/lib/api";

const TWOFA_PANEL: AuthPanelContent = {
  title: "Two-Factor Check",
  subtitle: "Verify it's you",
  desc: "Open your authenticator app and enter the rotating 6-digit code to finish signing in.",
  features: [
    { icon: "fas fa-shield-halved", title: "Extra Security", sub: "2-factor auth" },
    { icon: "fas fa-mobile-screen", title: "Authenticator", sub: "Rotating codes" },
    { icon: "fas fa-bolt", title: "Fast", sub: "Seconds to verify" },
    { icon: "fas fa-lock", title: "Protected", sub: "Account safety" },
  ],
};

interface VerifyResponse {
  needs_email_verification?: boolean;
}

interface MeUser {
  user?: { pin_gate?: boolean };
}

export default function TwoFaPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await bankFetch<VerifyResponse>("/auth/2fa", {
      method: "POST",
      body: { code },
    });
    if (!result.ok) {
      setLoading(false);
      setError(
        result.errorCode === "invalid_code"
          ? "That code is wrong or expired."
          : (result.error ?? "Failed"),
      );
      return;
    }
    if (result.data?.needs_email_verification) {
      setLoading(false);
      router.replace("/auth/verify-email");
      return;
    }
    const me = await bankFetch<MeUser>("/me");
    setLoading(false);
    if (me.ok && me.data?.user?.pin_gate) {
      router.replace("/pin");
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <AuthLayout left={TWOFA_PANEL}>
      <div className="overflow-hidden rounded-2xl border border-gray-200/50 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/90">
        <div className="mb-5 text-center">
          <div
            className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: "color-mix(in srgb, var(--brand) 14%, transparent)" }}
          >
            <i className="fas fa-shield-halved text-2xl" style={{ color: "var(--brand)" }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Two-factor check</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your authenticator.
          </p>
        </div>
        <form onSubmit={onSubmit}>
          <AuthInput
            label="Authenticator code"
            value={code}
            onChange={setCode}
            disabled={loading}
            placeholder="123456"
            error={error ?? undefined}
          />
          <SubmitButton loading={loading}>
            <i className="fas fa-check text-sm" />
            Verify
          </SubmitButton>
        </form>
      </div>
    </AuthLayout>
  );
}