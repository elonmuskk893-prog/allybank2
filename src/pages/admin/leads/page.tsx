"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Field, inputCls, Modal, Pill, TableWrap } from "@/components/admin/ui";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const STATUSES = ["new", "contacted", "qualified", "converted", "lost"];
const EMPTY = { id: "", name: "", email: "", phone: "", source: "", status: "new", notes: "" };

function LeadsAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch<{ leads: Lead[] }>(slug, `/leads${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    if (res.ok && res.data?.leads) setRows(res.data.leads);
  }, [slug, query]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    await adminFetch(slug, "/leads", {
      method: "POST",
      body: JSON.stringify({
        ...(editing.id ? { id: editing.id } : {}),
        name: editing.name,
        email: editing.email || null,
        phone: editing.phone || null,
        source: editing.source || "manual",
        status: editing.status,
        notes: editing.notes || null,
      }),
    });
    setSaving(false);
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    await adminFetch(slug, `/leads?id=${id}`, { method: "DELETE" });
    await load();
  };

  const advance = async (lead: Lead) => {
    const idx = STATUSES.indexOf(lead.status);
    const next = STATUSES[Math.min(idx + 1, STATUSES.length - 2)];
    await adminFetch(slug, "/leads", {
      method: "POST",
      body: JSON.stringify({ ...lead, status: next }),
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Leads</h1>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          + New lead
        </button>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search leads…"
        className="w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Name</th>
              <th className="px-4 py-2.5 text-left font-medium">Contact</th>
              <th className="px-4 py-2.5 text-left font-medium">Source</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{lead.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  <div>{lead.email ?? "--"}</div>
                  <div className="text-xs text-gray-500">{lead.phone ?? ""}</div>
                </td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{lead.source ?? "--"}</td>
                <td className="px-4 py-3"><Pill status={lead.status} /></td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  {lead.status !== "converted" && lead.status !== "lost" && (
                    <button onClick={() => advance(lead)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      Advance
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setEditing({
                        id: lead.id,
                        name: lead.name,
                        email: lead.email ?? "",
                        phone: lead.phone ?? "",
                        source: lead.source ?? "",
                        status: lead.status,
                        notes: lead.notes ?? "",
                      })
                    }
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                  >
                    Edit
                  </button>
                  <button onClick={() => remove(lead.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {editing && (
        <Modal title={editing.id ? "Edit lead" : "New lead"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field label="Name *">
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Phone">
                <input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Source">
                <input value={editing.source} onChange={(e) => setEditing({ ...editing, source: e.target.value })} className={inputCls} placeholder="manual" />
              </Field>
              <Field label="Status">
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className={inputCls}>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <textarea rows={3} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} className={inputCls} />
            </Field>
            <button
              onClick={save}
              disabled={saving}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {saving ? "Saving…" : "Save lead"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminLeadsPage() {
  return (
    <AdminShell>
      <LeadsAdmin />
    </AdminShell>
  );
}
