"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/next/navigation";
import { AuthLayout, type AuthPanelContent } from "@/components/auth/auth-layout";
import { AuthInput } from "@/components/auth/auth-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { bankFetch } from "@/lib/api";

const PIN_PANEL: AuthPanelContent = {
  title: "Verify Your PIN",
  subtitle: "Security Checkpoint",
  desc: "For your protection, confirm your transaction PIN to continue to your dashboard.",
  features: [
    { icon: "fas fa-shield-halved", title: "Extra Layer", sub: "PIN protection" },
    { icon: "fas fa-lock", title: "Private", sub: "Only you know it" },
    { icon: "fas fa-bolt", title: "Quick", sub: "One-time check" },
    { icon: "fas fa-user-shield", title: "Secure", sub: "Account security" },
  ],
};

interface MeResponse {
  user?: { pin_gate?: boolean; pin_set?: boolean };
}

export default function PinPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [pinSet, setPinSet] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [pin, setPin] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await bankFetch<MeResponse>("/me");
      if (!result.ok) {
        router.replace("/auth/login");
        return;
      }
      const user = result.data?.user;
      if (!user?.pin_gate) {
        router.replace("/dashboard");
        return;
      }
      setPinSet(Boolean(user.pin_set));
      setShowForm(true);
      setChecking(false);
    })();
  }, [router]);

  async function gateClear(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await bankFetch("/pin/gate-clear", {
      method: "POST",
      body: { pin },
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "That PIN is incorrect.");
      return;
    }
    router.replace("/dashboard");
  }

  async function submitNewPin(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (newPin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }
    setLoading(true);
    const result = await bankFetch("/me/pin", {
      method: "POST",
      body: { current_password: currentPassword, pin: newPin },
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Could not set your PIN.");
      return;
    }
    router.replace("/dashboard");
  }

  if (checking || !showForm) return null;

  return (
    <AuthLayout left={PIN_PANEL}>
      <div className="overflow-hidden rounded-2xl border border-gray-200/50 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/90">
        <div className="mb-5 text-center">
          <div
            className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl"
            style={{ background: "color-mix(in srgb, var(--brand) 14%, transparent)" }}
          >
            <i className="fa-solid fa-shield-halved text-lg" style={{ color: "var(--brand)" }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {pinSet ? "Enter your PIN" : "Set your transaction PIN"}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {pinSet
              ? "Confirm your 4-6 digit transaction PIN to continue."
              : "Create a 4-6 digit PIN to secure transfers and withdrawals."}
          </p>
        </div>

        {pinSet ? (
          <form onSubmit={gateClear}>
            <AuthInput
              label="Transaction PIN"
              type="password"
              value={pin}
              onChange={(v) => setPin(v.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••"
              error={error ?? undefined}
            />
            <SubmitButton loading={loading} disabled={pin.length < 4}>
              <i className="fas fa-unlock text-sm" />
              Verify & Continue
            </SubmitButton>
          </form>
        ) : (
          <form onSubmit={submitNewPin}>
            <AuthInput
              label="Account password"
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <AuthInput
              label="New PIN"
              type="password"
              value={newPin}
              onChange={(v) => setNewPin(v.replace(/\D/g, "").slice(0, 6))}
              placeholder="4-6 digits"
            />
            <AuthInput
              label="Confirm PIN"
              type="password"
              value={confirmPin}
              onChange={(v) => setConfirmPin(v.replace(/\D/g, "").slice(0, 6))}
              placeholder="Re-enter PIN"
              error={error ?? undefined}
            />
            <SubmitButton loading={loading} disabled={newPin.length < 4 || !currentPassword}>
              <i className="fas fa-shield-halved text-sm" />
              Set PIN & Continue
            </SubmitButton>
          </form>
        )}

        <button
          type="button"
          onClick={async () => {
            await bankFetch("/auth/logout", { method: "POST" });
            router.replace("/auth/login");
          }}
          className="mt-4 w-full text-center text-xs font-medium text-gray-500 hover:opacity-80 dark:text-gray-400"
        >
          Sign out instead
        </button>
      </div>
    </AuthLayout>
  );
}