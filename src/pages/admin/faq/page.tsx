"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Field, inputCls, Modal, TableWrap } from "@/components/admin/ui";

interface Faq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  enabled: boolean;
}

const EMPTY = { id: "", question: "", answer: "", sort_order: "100", enabled: true };

function FaqAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<Faq[]>([]);
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch<{ faqs: Faq[] }>(slug, "/faqs");
    if (res.ok && res.data?.faqs) setRows(res.data.faqs);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    await adminFetch(slug, "/faqs", {
      method: "POST",
      body: JSON.stringify({
        ...(editing.id ? { id: editing.id } : {}),
        question: editing.question,
        answer: editing.answer,
        sort_order: Number(editing.sort_order) || 100,
        enabled: editing.enabled,
      }),
    });
    setBusy(false);
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    await adminFetch(slug, `/faqs?id=${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">FAQ</h1>
          <p className="mt-1 text-sm text-gray-500">Entries appear on the public FAQ page.</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          + Add FAQ
        </button>
      </div>
      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Question</th>
              <th className="px-4 py-2.5 text-left font-medium">Order</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="max-w-md px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{f.question}</div>
                  <div className="line-clamp-1 text-xs text-gray-500">{f.answer}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{f.sort_order}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${f.enabled ? "text-emerald-600" : "text-gray-400"}`}>
                    {f.enabled ? "Published" : "Hidden"}
                  </span>
                </td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() =>
                      setEditing({
                        id: f.id,
                        question: f.question,
                        answer: f.answer,
                        sort_order: String(f.sort_order),
                        enabled: f.enabled,
                      })
                    }
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                  >
                    Edit
                  </button>
                  <button onClick={() => remove(f.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {editing && (
        <Modal title={editing.id ? "Edit FAQ" : "Add FAQ"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field label="Question *">
              <input value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Answer *">
              <textarea rows={4} value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Sort order">
              <input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} className={inputCls} />
            </Field>
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} className="h-4 w-4" />
              Published on the public FAQ page
            </label>
            <button
              onClick={save}
              disabled={busy}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {busy ? "Saving…" : "Save FAQ"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminFaqPage() {
  return (
    <AdminShell>
      <FaqAdmin />
    </AdminShell>
  );
}
