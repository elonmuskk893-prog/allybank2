"use client";

import { useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Field, inputCls } from "@/components/admin/ui";

interface CardSetup {
  daily_limit?: number;
  monthly_limit?: number;
  atm_withdrawals?: boolean;
  international_usage?: boolean;
  issue_fee?: number;
}

const DEFAULTS: Required<CardSetup> = {
  daily_limit: 5000,
  monthly_limit: 50000,
  atm_withdrawals: true,
  international_usage: false,
  issue_fee: 0,
};

function CardSettingsAdmin() {
  const { slug } = useAdmin();
  const [form, setForm] = useState<Required<CardSetup>>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await adminFetch<{ value: CardSetup | null }>(slug, "/card-settings");
      if (res.ok && res.data?.value) {
        setForm({ ...DEFAULTS, ...res.data.value });
      }
    })();
  }, [slug]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await adminFetch(slug, "/card-settings", {
      method: "POST",
      body: JSON.stringify({ value: form }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Card setup</h1>
      <div className="max-w-xl space-y-4 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Daily spend limit ($)">
            <input
              type="number"
              value={form.daily_limit}
              onChange={(e) => setForm({ ...form, daily_limit: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
          <Field label="Monthly limit ($)">
            <input
              type="number"
              value={form.monthly_limit}
              onChange={(e) => setForm({ ...form, monthly_limit: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Card issuance fee ($)">
          <input
            type="number"
            value={form.issue_fee}
            onChange={(e) => setForm({ ...form, issue_fee: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>
        <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={form.atm_withdrawals}
            onChange={(e) => setForm({ ...form, atm_withdrawals: e.target.checked })}
            className="h-4 w-4"
          />
          Allow ATM withdrawals
        </label>
        <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={form.international_usage}
            onChange={(e) => setForm({ ...form, international_usage: e.target.checked })}
            className="h-4 w-4"
          />
          Allow international usage
        </label>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save card settings"}
        </button>
      </div>
    </div>
  );
}

export default function AdminCardSettingsPage() {
  return (
    <AdminShell>
      <CardSettingsAdmin />
    </AdminShell>
  );
}
