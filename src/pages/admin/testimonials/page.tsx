"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Field, inputCls, Modal, TableWrap } from "@/components/admin/ui";

interface Testimonial {
  id: string;
  author: string;
  role: string | null;
  quote: string;
  rating: number;
  enabled: boolean;
}

const EMPTY = { id: "", author: "", role: "", quote: "", rating: "5", enabled: true };

function TestimonialsAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch<{ testimonials: Testimonial[] }>(slug, "/testimonials");
    if (res.ok && res.data?.testimonials) setRows(res.data.testimonials);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    await adminFetch(slug, "/testimonials", {
      method: "POST",
      body: JSON.stringify({
        ...(editing.id ? { id: editing.id } : {}),
        author: editing.author,
        role: editing.role || null,
        quote: editing.quote,
        rating: Number(editing.rating),
        enabled: editing.enabled,
      }),
    });
    setBusy(false);
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    await adminFetch(slug, `/testimonials?id=${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Testimonials</h1>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          + Add testimonial
        </button>
      </div>
      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Author</th>
              <th className="px-4 py-2.5 text-left font-medium">Quote</th>
              <th className="px-4 py-2.5 text-left font-medium">Rating</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{t.author}</div>
                  <div className="text-xs text-gray-500">{t.role ?? ""}</div>
                </td>
                <td className="max-w-sm px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                  <span className="line-clamp-2">{t.quote}</span>
                </td>
                <td className="px-4 py-3 text-amber-500">{"★".repeat(t.rating)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${t.enabled ? "text-emerald-600" : "text-gray-400"}`}>
                    {t.enabled ? "Published" : "Hidden"}
                  </span>
                </td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() =>
                      setEditing({
                        id: t.id,
                        author: t.author,
                        role: t.role ?? "",
                        quote: t.quote,
                        rating: String(t.rating),
                        enabled: t.enabled,
                      })
                    }
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                  >
                    Edit
                  </button>
                  <button onClick={() => remove(t.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {editing && (
        <Modal title={editing.id ? "Edit testimonial" : "Add testimonial"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Author *">
                <input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Role / location">
                <input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} className={inputCls} placeholder="Business owner, NYC" />
              </Field>
            </div>
            <Field label="Quote *">
              <textarea rows={3} value={editing.quote} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Rating">
              <select value={editing.rating} onChange={(e) => setEditing({ ...editing, rating: e.target.value })} className={inputCls}>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {"★".repeat(r)}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} className="h-4 w-4" />
              Published
            </label>
            <button
              onClick={save}
              disabled={busy}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {busy ? "Saving…" : "Save testimonial"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminTestimonialsPage() {
  return (
    <AdminShell>
      <TestimonialsAdmin />
    </AdminShell>
  );
}
