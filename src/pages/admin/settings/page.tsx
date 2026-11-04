"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
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
  live_chat: {
    enabled?: boolean;
    position?: string;
    offset_bottom?: number;
    welcome_message?: string;
    title?: string;
    dashboard_only?: boolean;
  };
  security: Record<string, unknown>;
  features: Record<string, unknown>;
  email?: Record<string, unknown>;
}

const EMPTY_EMAIL = {
  provider: "smtp",
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_password: "",
  encryption: "starttls",
  api_key: "",
  from_email: "",
  from_name: "",
};

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
  const { slug } = useAdmin();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [general, setGeneral] = useState({ name: "", brand_color: "#0ea5e9", logo_url: "" });
  const [contact, setContact] = useState<Record<string, string>>({});
  const [chat, setChat] = useState({
    enabled: false,
    position: "bottom-right",
    offset_bottom: 96,
    welcome_message: "Hi! How can we help you today?",
    title: "Live support",
    dashboard_only: true,
  });
  const [email, setEmail] = useState({ ...EMPTY_EMAIL });
  const [testTo, setTestTo] = useState("");
  const [testState, setTestState] = useState<string | null>(null);
  const [features, setFeatures] = useState({ maintenance_mode: false });
  const [savedGroup, setSavedGroup] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch<Settings>(slug, "/settings");
    if (!res.ok || !res.data) return;
    const s = res.data;
    setSettings(s);
    setGeneral({
      name: s.site?.name ?? "",
      brand_color: s.site?.brand_color ?? "#0ea5e9",
      logo_url: s.site?.logo_url ?? "",
    });
    setContact(Object.fromEntries(CONTACT_FIELDS.map(([k]) => [k, String(s.contact?.[k] ?? "")])));
    setChat({
      enabled: Boolean(s.live_chat?.enabled),
      position: String(s.live_chat?.position ?? "bottom-right"),
      offset_bottom: Number(s.live_chat?.offset_bottom ?? 96),
      welcome_message: String(s.live_chat?.welcome_message ?? "Hi! How can we help you today?"),
      title: String(s.live_chat?.title ?? "Live support"),
      dashboard_only: s.live_chat?.dashboard_only !== false,
    });
    setEmail({
      ...EMPTY_EMAIL,
      ...Object.fromEntries(Object.entries(s.email ?? {}).map(([k, v]) => [k, String(v ?? "")])),
    });
    setFeatures({ maintenance_mode: Boolean(s.features?.maintenance_mode) });
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (group: string, value: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    const res = await adminFetch(slug, "/settings", {
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

      {/* Live chat */}
      <section className="max-w-2xl space-y-4 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Live chat</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chat.enabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700/60"}`}>
            {chat.enabled ? "Live" : "Disabled"}
          </span>
        </div>
        <Toggle
          checked={chat.enabled}
          onChange={(v) => setChat({ ...chat, enabled: v })}
          label="Enable live chat"
          hint="Messages are handled by the built-in support inbox."
        />
        <Toggle
          checked={chat.dashboard_only}
          onChange={(v) => setChat({ ...chat, dashboard_only: v })}
          label="Signed-in dashboard only"
          hint="Keeps the bubble off the homepage, login and registration pages."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Bubble position">
            <select value={chat.position} onChange={(e) => setChat({ ...chat, position: e.target.value })} className={inputCls}>
              <option value="bottom-right">Bottom right</option>
              <option value="bottom-left">Bottom left</option>
            </select>
          </Field>
          <Field label="Distance from bottom on mobile (px)">
            <input
              type="number"
              min="0"
              value={chat.offset_bottom}
              onChange={(e) => setChat({ ...chat, offset_bottom: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
          <Field label="Chat window title">
            <input value={chat.title} onChange={(e) => setChat({ ...chat, title: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <Field label="Welcome message">
          <input
            value={chat.welcome_message}
            onChange={(e) => setChat({ ...chat, welcome_message: e.target.value })}
            className={inputCls}
          />
        </Field>
        <button
          disabled={busy}
          onClick={() => save("live_chat", chat)}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {savedGroup === "live_chat" ? "Saved & applied ✓" : "Save live chat settings"}
        </button>
      </section>

      {/* Email / SMTP */}
      <section className="max-w-2xl space-y-4 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Email / SMTP</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Used for verification codes, password resets, and deposit/withdrawal notifications.
          Credentials are stored on the server and never sent to the browser.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Delivery method">
            <select value={String(email.provider)} onChange={(e) => setEmail({ ...email, provider: e.target.value })} className={inputCls}>
              <option value="smtp">SMTP server</option>
              <option value="resend">Resend API</option>
              <option value="mailersend">MailerSend API</option>
            </select>
          </Field>
          <Field label="From name">
            <input value={String(email.from_name)} onChange={(e) => setEmail({ ...email, from_name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="From email">
            <input value={String(email.from_email)} onChange={(e) => setEmail({ ...email, from_email: e.target.value })} className={inputCls} placeholder="no-reply@yourbank.com" />
          </Field>
          {email.provider === "smtp" ? (
            <>
              <Field label="SMTP host">
                <input value={String(email.smtp_host)} onChange={(e) => setEmail({ ...email, smtp_host: e.target.value })} className={inputCls} placeholder="smtp.yourhost.com" />
              </Field>
              <Field label="SMTP port">
                <input value={String(email.smtp_port)} onChange={(e) => setEmail({ ...email, smtp_port: e.target.value })} className={inputCls} placeholder="587" />
              </Field>
              <Field label="Encryption">
                <select value={String(email.encryption)} onChange={(e) => setEmail({ ...email, encryption: e.target.value })} className={inputCls}>
                  <option value="starttls">STARTTLS (587)</option>
                  <option value="tls">SSL/TLS (465)</option>
                  <option value="none">None</option>
                </select>
              </Field>
              <Field label="SMTP username">
                <input value={String(email.smtp_user)} onChange={(e) => setEmail({ ...email, smtp_user: e.target.value })} className={inputCls} />
              </Field>
              <Field label="SMTP password">
                <input type="password" value={String(email.smtp_password)} onChange={(e) => setEmail({ ...email, smtp_password: e.target.value })} className={inputCls} placeholder="••••••••" />
              </Field>
            </>
          ) : (
            <Field label="API key">
              <input type="password" value={String(email.api_key)} onChange={(e) => setEmail({ ...email, api_key: e.target.value })} className={inputCls} placeholder="••••••••" />
            </Field>
          )}
        </div>
        <button
          disabled={busy}
          onClick={() => save("email", email)}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {savedGroup === "email" ? "Saved ✓" : "Save email settings"}
        </button>

        <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/40">
          <Field label="Send a test email to">
            <input value={testTo} onChange={(e) => setTestTo(e.target.value)} className={inputCls} placeholder="you@example.com" />
          </Field>
          <button
            disabled={busy || !testTo}
            onClick={async () => {
              setBusy(true);
              setTestState(null);
              const res = await adminFetch(slug, "/test-email", {
                method: "POST",
                body: JSON.stringify({ to: testTo }),
              });
              setBusy(false);
              setTestState(res.ok ? "Test email sent — check the inbox." : (res.error ?? "The test email failed."));
            }}
            className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
          >
            Send test email
          </button>
          {testState && <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{testState}</p>}
        </div>
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
