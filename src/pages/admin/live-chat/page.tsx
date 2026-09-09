"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Field, inputCls } from "@/components/admin/ui";

interface LiveChatSettings {
  provider?: string;
  enabled?: boolean;
  key?: string;
}

/** Extracts the Smartsupp key from a bare key or a full install snippet. */
function extractSmartsuppKey(input: string): string {
  const value = input.trim();
  if (!value) return "";
  if (/^[\w-]{8,}$/.test(value)) return value;
  const match = value.match(/key\s*[:=]\s*["']([\w-]+)["']/);
  return match ? match[1] : "";
}

function LiveChatAdmin() {
  const [enabled, setEnabled] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch<{ live_chat: LiveChatSettings }>("teslamodel", "/settings");
    if (res.ok && res.data?.live_chat) {
      setEnabled(Boolean(res.data.live_chat.enabled));
      setKeyInput(String(res.data.live_chat.key ?? ""));
      setSavedKey(String(res.data.live_chat.key ?? ""));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    setError(null);
    const key = extractSmartsuppKey(keyInput);
    if (enabled && !key) {
      setBusy(false);
      setError("Paste your Smartsupp key (or the full install snippet) before enabling.");
      return;
    }
    const res = await adminFetch("teslamodel", "/settings", {
      method: "PUT",
      body: JSON.stringify({
        group: "live_chat",
        value: { provider: "smartsupp", enabled, key },
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Save failed.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    await load();
  };

  const parsed = extractSmartsuppKey(keyInput);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Live chat</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Manage the Smartsupp live-chat widget shown on the customer-facing website.
          Saving applies the change immediately — no redeploy needed.
        </p>
      </div>

      <section className="max-w-2xl space-y-5 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Smartsupp</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              enabled && parsed
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300"
            }`}
          >
            {enabled && parsed ? "Live on site" : "Disabled"}
          </span>
        </div>

        <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="font-medium">Enable Smartsupp widget</span>
            <span className="block text-xs text-gray-500">
              The chat bubble appears on every customer-facing page for all visitors.
            </span>
          </span>
        </label>

        <Field label="Smartsupp installation code or key">
          <textarea
            rows={5}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className={`${inputCls} font-mono text-xs`}
            placeholder={`<script>\n  var _smartsupp = _smartsupp || {};\n  _smartsupp.key = "your-smartsupp-key";\n</script>\n\n…or just paste the key: your-smartsupp-key`}
          />
        </Field>

        {parsed && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            ✓ Detected key: <span className="font-mono">{parsed}</span>
          </p>
        )}
        {enabled && !parsed && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            No valid Smartsupp key detected yet — the widget will stay off until one is saved.
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>
        )}

        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {busy ? "Saving…" : saved ? "Saved & applied to site ✓" : "Save live chat settings"}
        </button>

        <p className="text-xs text-gray-400">
          Where do I find my key? Smartsupp dashboard → Settings → Chat box → Your API key,
          or copy the whole install code from Settings → Code.
        </p>
      </section>
    </div>
  );
}

export default function AdminLiveChatPage() {
  return (
    <AdminShell>
      <LiveChatAdmin />
    </AdminShell>
  );
}
