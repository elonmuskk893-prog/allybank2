"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "@/lib/next/link";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/app-shell";
import { bankFetch } from "@/lib/api";

interface SecurityStatus {
  twofa_enabled: boolean;
  twofa_method: string;
  pin_set: boolean;
  email: string;
  email_verified: boolean;
}

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function SecurityPage() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [twofaPassword, setTwofaPassword] = useState("");
  const [savingTwofa, setSavingTwofa] = useState(false);

  const load = useCallback(async () => {
    const res = await bankFetch<SecurityStatus>("/security");
    if (res.ok && res.data) setStatus(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (next.length < 8) {
      toast.error("Your new password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      toast.error("The new passwords do not match.");
      return;
    }
    setSavingPassword(true);
    const res = await bankFetch("/security/password", {
      method: "POST",
      body: { current_password: current, new_password: next },
    });
    setSavingPassword(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not change your password.");
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Password updated. Use it the next time you sign in.");
    load();
  };

  const toggleTwofa = async (enabled: boolean) => {
    if (!twofaPassword) {
      toast.error("Enter your password to confirm this change.");
      return;
    }
    setSavingTwofa(true);
    const res = await bankFetch<{ twofa_enabled: boolean }>("/security/twofa", {
      method: "POST",
      body: { enabled, current_password: twofaPassword },
    });
    setSavingTwofa(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not update two-factor authentication.");
      return;
    }
    setTwofaPassword("");
    toast.success(enabled ? "Two-factor authentication is on." : "Two-factor authentication is off.");
    load();
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-28">
      <div>
        <Link href="/settings" className="text-sm text-sky-600 hover:underline dark:text-sky-400">
          ← Back to settings
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Password &amp; security</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your sign-in password and two-step verification.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Two-factor", value: status?.twofa_enabled ? "Enabled" : "Disabled", good: Boolean(status?.twofa_enabled) },
          { label: "Transaction PIN", value: status?.pin_set ? "Set" : "Not set", good: Boolean(status?.pin_set) },
          { label: "Email verified", value: status?.email_verified ? "Verified" : "Pending", good: Boolean(status?.email_verified) },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-800">
            <p className="text-xs uppercase tracking-wider text-gray-500">{item.label}</p>
            <p className={`mt-1 text-sm font-semibold ${item.good ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {status ? item.value : "…"}
            </p>
          </div>
        ))}
      </div>

      <Card title="Change password" description="Use at least 8 characters. You'll stay signed in on this device.">
        <form onSubmit={changePassword} className="space-y-4">
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputCls}
            required
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="New password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputCls}
            required
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
            required
          />
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--brand)" }}
          >
            {savingPassword ? "Updating…" : "Update password"}
          </button>
        </form>
      </Card>

      <Card
        title="Two-factor authentication"
        description={`A one-time code is emailed to ${status?.email ?? "your address"} each time you sign in.`}
      >
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Confirm with your password"
          value={twofaPassword}
          onChange={(e) => setTwofaPassword(e.target.value)}
          className={inputCls}
        />
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => toggleTwofa(!status?.twofa_enabled)}
            disabled={savingTwofa || !status}
            className="rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: status?.twofa_enabled ? "#dc2626" : "var(--brand)" }}
          >
            {savingTwofa
              ? "Saving…"
              : status?.twofa_enabled
                ? "Turn off two-factor"
                : "Turn on two-factor"}
          </button>
          <Link
            href="/pin"
            className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
          >
            {status?.pin_set ? "Change transaction PIN" : "Set transaction PIN"}
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function SettingsSecurityPage() {
  return (
    <AppShell>
      <SecurityPage />
    </AppShell>
  );
}
