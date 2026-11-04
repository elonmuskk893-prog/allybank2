"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Field, inputCls, Modal, Pill, TableWrap } from "@/components/admin/ui";

interface Refund {
  id: string;
  user_id: string;
  email?: string;
  tax_year: number;
  amount: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const EMPTY = { id: "", user_id: "", tax_year: "2025", amount: "", status: "pending", notes: "" };

function toNum(v: string): number | null {
  const cleaned = v.replace(/[^0-9.\-]/g, "");
  return cleaned ? Number(cleaned) : null;
}

function IrsAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<Refund[]>([]);
  const [users, setUsers] = useState<{ id: string; email?: string }[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [refundsRes, usersRes] = await Promise.all([
      adminFetch<{ refunds: Refund[] }>(
        slug,
        `/irs-refunds${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      ),
      adminFetch<{ users: { id: string; email?: string }[] }>(slug, "/users"),
    ]);
    if (refundsRes.ok && refundsRes.data?.refunds) setRows(refundsRes.data.refunds);
    if (usersRes.ok && usersRes.data?.users) setUsers(usersRes.data.users.slice(0, 100));
  }, [slug, query]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    await adminFetch(slug, "/irs-refunds", {
      method: "POST",
      body: JSON.stringify({
        ...(editing.id ? { id: editing.id } : {}),
        user_id: editing.user_id,
        tax_year: toNum(editing.tax_year) ?? 2025,
        amount: toNum(editing.amount) ?? 0,
        status: editing.status,
        notes: editing.notes || null,
      }),
    });
    setSaving(false);
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    await adminFetch(slug, `/irs-refunds?id=${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Tax documents
        </h1>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          + New document
        </button>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by member email…"
        className="w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Member</th>
              <th className="px-4 py-2.5 text-left font-medium">Tax year</th>
              <th className="px-4 py-2.5 text-left font-medium">Amount</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-gray-100 last:border-0 dark:border-gray-700/60"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {r.email ?? "--"}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.tax_year}</td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                  {Number(r.amount).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Pill status={r.status} />
                </td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() =>
                      setEditing({
                        id: r.id,
                        user_id: r.user_id,
                        tax_year: String(r.tax_year),
                        amount: String(Number(r.amount)),
                        status: r.status,
                        notes: r.notes ?? "",
                      })
                    }
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {editing && (
        <Modal title={editing.id ? "Edit refund" : "New refund"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            {!editing.id && (
              <Field label="Member *">
                <select
                  value={editing.user_id}
                  onChange={(e) => setEditing({ ...editing, user_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Select a user…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tax year">
                <input
                  type="number"
                  value={editing.tax_year}
                  onChange={(e) => setEditing({ ...editing, tax_year: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Amount ($)">
                <input
                  type="number"
                  step="any"
                  value={editing.amount}
                  onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Status">
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                className={inputCls}
              >
                {["pending", "approved", "completed", "rejected"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Notes">
              <textarea
                rows={2}
                value={editing.notes}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className={inputCls}
              />
            </Field>
            <button
              onClick={save}
              disabled={saving || (!editing.id && !editing.user_id)}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {saving ? "Saving…" : "Save refund"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminIrsPage() {
  return (
    <AdminShell>
      <IrsAdmin />
    </AdminShell>
  );
}
