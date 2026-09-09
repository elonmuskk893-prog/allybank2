"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Field, inputCls, Modal, Pill, TableWrap } from "@/components/admin/ui";

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rate: string;
  enabled: boolean;
}

const EMPTY = { id: "", code: "", name: "", symbol: "$", rate: "1", enabled: true };

function CurrenciesAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<Currency[]>([]);
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch<{ currencies: Currency[] }>(slug, "/currencies");
    if (res.ok && res.data?.currencies) setRows(res.data.currencies);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    await adminFetch(slug, "/currencies", {
      method: "POST",
      body: JSON.stringify({
        ...(editing.id ? { id: editing.id } : {}),
        code: editing.code,
        name: editing.name,
        symbol: editing.symbol,
        rate: Number(editing.rate),
        enabled: editing.enabled,
      }),
    });
    setSaving(false);
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    await adminFetch(slug, `/currencies?id=${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Currencies</h1>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          + Add currency
        </button>
      </div>
      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Code</th>
              <th className="px-4 py-2.5 text-left font-medium">Name</th>
              <th className="px-4 py-2.5 text-left font-medium">Symbol</th>
              <th className="px-4 py-2.5 text-left font-medium">Rate (vs USD)</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">{c.code}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.symbol}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{Number(c.rate).toLocaleString()}</td>
                <td className="px-4 py-3"><Pill status={c.enabled ? "active" : "disabled"} /></td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() =>
                      setEditing({ id: c.id, code: c.code, name: c.name, symbol: c.symbol, rate: String(Number(c.rate)), enabled: c.enabled })
                    }
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                  >
                    Edit
                  </button>
                  <button onClick={() => remove(c.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {editing && (
        <Modal title={editing.id ? `Edit ${editing.code}` : "Add currency"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Code *">
                <input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} maxLength={3} className={inputCls} placeholder="EUR" />
              </Field>
              <Field label="Name *">
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputCls} placeholder="Euro" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Symbol">
                <input value={editing.symbol} onChange={(e) => setEditing({ ...editing, symbol: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Rate vs USD">
                <input type="number" step="any" value={editing.rate} onChange={(e) => setEditing({ ...editing, rate: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} className="h-4 w-4" />
              Enabled
            </label>
            <button
              onClick={save}
              disabled={saving}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {saving ? "Saving…" : "Save currency"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminCurrenciesPage() {
  return (
    <AdminShell>
      <CurrenciesAdmin />
    </AdminShell>
  );
}
