"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Field, inputCls, Modal, Pill } from "@/components/admin/ui";

interface CustomField {
  id: string;
  label: string;
  type: string;
  role?: "input" | "display";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  value?: string | null;
}

interface Method {
  id: string;
  name: string;
  type: "deposit" | "withdrawal";
  emoji: string;
  minimum: number | string | null;
  maximum: number | string | null;
  charges_amount: number | string | null;
  duration: string | null;
  instructions: string | null;
  custom_fields: CustomField[];
  enabled: boolean;
  sort_order: number;
}

const EMPTY_FIELD: CustomField = {
  id: "",
  label: "",
  type: "text",
  role: "display",
  required: false,
  placeholder: "",
  options: [],
  value: "",
};

type EditorState = {
  id: string;
  name: string;
  type: "deposit" | "withdrawal";
  emoji: string;
  minimum: string;
  maximum: string;
  charges_amount: string;
  duration: string;
  instructions: string;
  enabled: boolean;
  sort_order: number;
  custom_fields: CustomField[];
};

const EMPTY_METHOD: EditorState = {
  id: "",
  name: "",
  type: "deposit",
  emoji: "🏦",
  minimum: "",
  maximum: "",
  charges_amount: "",
  duration: "",
  instructions: "",
  enabled: true,
  sort_order: 500,
  custom_fields: [],
};

function toEditor(m: Method): EditorState {
  return {
    id: m.id,
    name: m.name,
    type: m.type,
    emoji: m.emoji ?? "💳",
    minimum: m.minimum == null ? "" : String(Number(m.minimum)),
    maximum: m.maximum == null ? "" : String(Number(m.maximum)),
    charges_amount: m.charges_amount == null ? "" : String(Number(m.charges_amount)),
    duration: m.duration ?? "",
    instructions: m.instructions ?? "",
    enabled: m.enabled ?? true,
    sort_order: m.sort_order ?? 500,
    custom_fields: (m.custom_fields ?? []).map((f) => ({ ...EMPTY_FIELD, ...f })),
  };
}

function PaymentMethodsAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<Method[]>([]);
  const [editing, setEditing] = useState<EditorState | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch<{ methods: Method[] }>(slug, "/payment-methods");
    if (res.ok && res.data?.methods) setRows(res.data.methods);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    await adminFetch(slug, "/payment-methods", {
      method: "POST",
      body: JSON.stringify({
        ...(editing.id ? { id: editing.id } : {}),
        ...editing,
        minimum: editing.minimum === "" ? 0 : Number(editing.minimum),
        maximum: editing.maximum === "" ? 0 : Number(editing.maximum),
        charges_amount: editing.charges_amount === "" ? 0 : Number(editing.charges_amount),
        custom_fields: editing.custom_fields
          .filter((f) => f.label.trim())
          .map((f) => ({
            ...f,
            value: f.role === "display" ? f.value ?? "" : null,
          })),
      }),
    });
    setBusy(false);
    setEditing(null);
    await load();
  };

  const toggleEnabled = async (m: Method) => {
    await adminFetch(slug, "/payment-methods", {
      method: "POST",
      body: JSON.stringify({ action: "toggle", id: m.id, enabled: !m.enabled }),
    });
    await load();
  };

  const remove = async (id: string) => {
    await adminFetch(slug, "/payment-methods", {
      method: "POST",
      body: JSON.stringify({ action: "delete", id }),
    });
    await load();
  };

  const updateField = (idx: number, patch: Partial<CustomField>) => {
    if (!editing) return;
    setEditing({
      ...editing,
      custom_fields: editing.custom_fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Payment Methods</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Changes apply instantly to the user-facing deposit and withdrawal pages.
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY_METHOD })}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          + Add method
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200/70 bg-white backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No payment methods configured.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Method</th>
                <th className="px-4 py-2.5 text-left font-medium">Type</th>
                <th className="px-4 py-2.5 text-left font-medium">Limits</th>
                <th className="px-4 py-2.5 text-left font-medium">Details</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                  <td className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl">{m.emoji}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{m.name}</span>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{m.type}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    min {Number(m.minimum ?? 0).toLocaleString()} · max {Number(m.maximum ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {(m.custom_fields ?? []).filter((f) => (f.value ?? "").trim()).length} field(s)
                  </td>
                  <td className="px-4 py-3">
                    <Pill status={m.enabled ? "active" : "disabled"} />
                  </td>
                  <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => toggleEnabled(m)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${m.enabled ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                      {m.enabled ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => setEditing(toEditor(m))} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                      Edit
                    </button>
                    <button onClick={() => remove(m.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : "Add payment method"} onClose={() => setEditing(null)} >
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-[70px_1fr] gap-3">
              <Field label="Emoji">
                <input value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} className={`${inputCls} text-center`} maxLength={4} />
              </Field>
              <Field label="Name *">
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputCls} placeholder="Bank Transfer" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select
                  value={editing.type}
                  disabled={Boolean(editing.id)}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value as "deposit" | "withdrawal" })}
                  className={inputCls}
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                </select>
              </Field>
              <Field label="Processing time">
                <input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} className={inputCls} placeholder="1-2 business days" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Minimum">
                <input type="number" step="any" value={editing.minimum} onChange={(e) => setEditing({ ...editing, minimum: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Maximum">
                <input type="number" step="any" value={editing.maximum} onChange={(e) => setEditing({ ...editing, maximum: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Fee">
                <input type="number" step="any" value={editing.charges_amount} onChange={(e) => setEditing({ ...editing, charges_amount: e.target.value })} className={inputCls} />
              </Field>
            </div>

            {/* Payment details shown on the user-facing form */}
            <div className="rounded-xl border border-gray-200/80 p-3 dark:border-gray-700/60">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Payment details (shown with copy buttons)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      custom_fields: [
                        ...editing.custom_fields,
                        { ...EMPTY_FIELD, id: `f-${Date.now()}`, type: "text", role: "display" },
                      ],
                    })
                  }
                  className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  + Add detail
                </button>
              </div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                e.g. “Wallet address”, “Account number”. Values are displayed to users with a copy button.
              </p>
              <div className="space-y-2">
                {editing.custom_fields.map((f, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_92px_auto] items-center gap-2">
                    <input
                      value={f.label}
                      onChange={(e) => updateField(idx, { label: e.target.value })}
                      placeholder="Label (Wallet address)"
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900"
                    />
                    <input
                      value={f.role === "display" ? f.value ?? "" : ""}
                      disabled={f.role !== "display"}
                      onChange={(e) => updateField(idx, { value: e.target.value })}
                      placeholder="Value shown to users (bc1q…)"
                      className="rounded-lg border border-gray-200 px-2 py-1.5 font-mono text-xs dark:border-gray-700 dark:bg-gray-900"
                    />
                    <select
                      value={f.role ?? "display"}
                      onChange={(e) => updateField(idx, { role: e.target.value as "display" | "input" })}
                      className="rounded-lg border border-gray-200 px-1.5 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900"
                    >
                      <option value="display">Display</option>
                      <option value="input">Input</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, custom_fields: editing.custom_fields.filter((_, i) => i !== idx) })}
                      className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                      aria-label="Remove detail"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {editing.custom_fields.length === 0 && (
                  <p className="py-2 text-center text-xs text-gray-400">No details yet.</p>
                )}
              </div>
            </div>

            {/* Instructions */}
            <Field label="Instructions shown to the user">
              <textarea
                rows={3}
                value={editing.instructions}
                onChange={(e) => setEditing({ ...editing, instructions: e.target.value })}
                className={inputCls}
                placeholder="Send funds to the address above, then enter your transaction hash."
              />
            </Field>

            <Toggle enabled={editing.enabled} onChange={(v) => setEditing({ ...editing, enabled: v })} />

            <button
              onClick={save}
              disabled={busy || !editing.name.trim()}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {busy ? "Saving…" : "Save method"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
      <input type="checkbox" checked={enabled} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      Enabled — visible to users right away
    </label>
  );
}

export default function AdminPaymentMethodsPage() {
  return (
    <AdminShell>
      <PaymentMethodsAdmin />
    </AdminShell>
  );
}
