"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Field, inputCls } from "@/components/admin/ui";

interface SiteRow {
  id: number;
  name: string;
  brand_color: string;
  logo_url: string | null;
}

interface Settings {
  site: SiteRow;
  contact: Record<string, unknown>;
  live_chat: { provider?: string; enabled?: boolean; key?: string };
  security: Record<string, unknown>;
  features: Record<string, unknown>;
}

const CONTACT_FIELDS: [string, string][] = [
  ["support_email", "Support email"],
  ["contact_phone", "Contact phone"],
  ["address", "Office address"],
  ["facebook_url", "Facebook URL"],
  ["twitter_url", "X / Twitter URL"],
  ["instagram_url", "Instagram URL"],
];

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4"
      />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}

function SettingsAdmin() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [general, setGeneral] = useState({ name: "", brand_color: "#0ea5e9", logo_url: "" });
  const [contact, setContact] = useState<Record<string, string>>({});
  const [chat, setChat] = useState({ enabled: false, key: "" });
  const [features, setFeatures] = useState({ maintenance_mode: false });
  const [savedGroup, setSavedGroup] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch<Settings>("teslamodel", "/settings");
    if (!res.ok || !res.data) return;
    const s = res.data;
    setSettings(s);
    setGeneral({
      name: s.site?.name ?? "",
      brand_color: s.site?.brand_color ?? "#0ea5e9",
      logo_url: s.site?.logo_url ?? "",
    });
    setContact(Object.fromEntries(CONTACT_FIELDS.map(([k]) => [k, String(s.contact?.[k] ?? "")])));
    setChat({ enabled: Boolean(s.live_chat?.enabled), key: String(s.live_chat?.key ?? "") });
    setFeatures({ maintenance_mode: Boolean(s.features?.maintenance_mode) });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (group: string, value: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    const res = await adminFetch("teslamodel", "/settings", {
      method: "PUT",
      body: JSON.stringify({ group, value }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Save failed.");
      return;
    }
    setSavedGroup(group);
    setTimeout(() => setSavedGroup(null), 2500);
    await load();
  };

  if (!settings) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading settings…</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>
      )}

      {/* Site identity */}
      <section className="max-w-2xl space-y-4 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Site identity</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Website name">
            <input value={general.name} onChange={(e) => setGeneral({ ...general, name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Brand color">
            <div className="flex gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(general.brand_color) ? general.brand_color : "#0ea5e9"}
                onChange={(e) => setGeneral({ ...general, brand_color: e.target.value })}
                className="h-[38px] w-12 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <input value={general.brand_color} onChange={(e) => setGeneral({ ...general, brand_color: e.target.value })} className={inputCls} />
            </div>
          </Field>
        </div>
        <Field label="Logo URL (optional)">
          <input value={general.logo_url} onChange={(e) => setGeneral({ ...general, logo_url: e.target.value })} className={inputCls} placeholder="https://…" />
        </Field>
        <button
          disabled={busy}
          onClick={() => save("general", general)}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {savedGroup === "general" ? "Saved ✓" : "Save site identity"}
        </button>
      </section>

      {/* Contact information */}
      <section className="max-w-2xl space-y-4 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contact information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CONTACT_FIELDS.map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                value={contact[key] ?? ""}
                onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
                className={inputCls}
              />
            </Field>
          ))}
        </div>
        <button
          disabled={busy}
          onClick={() => save("contact", contact)}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {savedGroup === "contact" ? "Saved ✓" : "Save contact info"}
        </button>
      </section>

      {/* Live chat — Smartsupp */}
      <section className="max-w-2xl space-y-4 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Live chat (Smartsupp)</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chat.enabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700/60"}`}>
            {chat.enabled ? "Live on site" : "Disabled"}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Paste your Smartsupp dashboard key (or the whole install snippet — the key is extracted automatically).
          Saving applies the widget to the website immediately; no redeploy needed.
        </p>
        <Toggle
          checked={chat.enabled}
          onChange={(v) => setChat({ ...chat, enabled: v })}
          label="Enable Smartsupp live chat widget"
          hint="The chat bubble appears on all customer-facing pages."
        />
        <Field label="Smartsupp key or install code">
          <textarea
            rows={4}
            value={chat.key}
            onChange={(e) => setChat({ ...chat, key: e.target.value })}
            className={`${inputCls} font-mono text-xs`}
            placeholder='_smartsupp.key = "abc123def456…";   — or just abc123def456…'
          />
        </Field>
        <button
          disabled={busy}
          onClick={() => save("live_chat", { provider: "smartsupp", enabled: chat.enabled, key: chat.key })}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {savedGroup === "live_chat" ? "Saved & applied ✓" : "Save live chat settings"}
        </button>
      </section>

      {/* Features */}
      <section className="max-w-2xl space-y-4 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Feature toggles</h2>
        <Toggle
          checked={features.maintenance_mode}
          onChange={(v) => setFeatures({ ...features, maintenance_mode: v })}
          label="Maintenance mode"
          hint="Advertises maintenance state through the public site-settings API for custom handling."
        />
        <button
          disabled={busy}
          onClick={() => save("features", features)}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {savedGroup === "features" ? "Saved ✓" : "Save features"}
        </button>
      </section>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <SettingsAdmin />
    </AdminShell>
  );
}
