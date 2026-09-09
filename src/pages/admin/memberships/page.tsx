"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Field, inputCls, Modal, Pill, TableWrap } from "@/components/admin/ui";

interface Membership {
  id: string;
  user_id: string;
  email?: string;
  tier: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

const EMPTY = { id: "", user_id: "", tier: "standard", status: "active", ends_at: "" };

function MembershipsAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<Membership[]>([]);
  const [users, setUsers] = useState<{ id: string; email?: string }[]>([]);
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [memRes, usersRes] = await Promise.all([
      adminFetch<{ memberships: Membership[] }>(slug, "/memberships"),
      adminFetch<{ users: { id: string; email?: string }[] }>(slug, "/users"),
    ]);
    if (memRes.ok && memRes.data?.memberships) setRows(memRes.data.memberships);
    if (usersRes.ok && usersRes.data?.users) setUsers(usersRes.data.users.slice(0, 100));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    await adminFetch(slug, "/memberships", {
      method: "POST",
      body: JSON.stringify({
        ...(editing.id ? { id: editing.id } : {}),
        user_id: editing.user_id,
        tier: editing.tier,
        status: editing.status,
        ends_at: editing.ends_at ? new Date(editing.ends_at).toISOString() : null,
      }),
    });
    setSaving(false);
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    await adminFetch(slug, `/memberships?id=${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Membership</h1>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          + New membership
        </button>
      </div>
      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Member</th>
              <th className="px-4 py-2.5 text-left font-medium">Tier</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-left font-medium">Ends</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{m.email ?? "--"}</td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{m.tier}</td>
                <td className="px-4 py-3"><Pill status={m.status} /></td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {m.ends_at ? new Date(m.ends_at).toLocaleDateString() : "--"}
                </td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() =>
                      setEditing({
                        id: m.id,
                        user_id: m.user_id ?? "",
                        tier: m.tier,
                        status: m.status,
                        ends_at: m.ends_at ? m.ends_at.slice(0, 10) : "",
                      })
                    }
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                  >
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
      </TableWrap>

      {editing && (
        <Modal title={editing.id ? "Edit membership" : "New membership"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            {!editing.id && (
              <Field label="Member *">
                <select value={editing.user_id} onChange={(e) => setEditing({ ...editing, user_id: e.target.value })} className={inputCls}>
                  <option value="">Select a user…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Tier">
              <select value={editing.tier} onChange={(e) => setEditing({ ...editing, tier: e.target.value })} className={inputCls}>
                {["standard", "silver", "gold", "platinum"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className={inputCls}>
                  {["active", "expired", "cancelled"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ends at">
                <input type="date" value={editing.ends_at} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <button
              onClick={save}
              disabled={saving || (!editing.id && !editing.user_id)}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {saving ? "Saving…" : "Save membership"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminMembershipsPage() {
  return (
    <AdminShell>
      <MembershipsAdmin />
    </AdminShell>
  );
}
