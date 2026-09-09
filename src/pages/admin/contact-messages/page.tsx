"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { TableWrap } from "@/components/admin/ui";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

function InboxAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const res = await adminFetch<{ messages: ContactMessage[] }>(slug, `/contact-messages${filter ? `?handled=${filter}` : ""}`);
    if (res.ok && res.data?.messages) setRows(res.data.messages);
  }, [slug, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const mark = async (id: string, handled: boolean) => {
    await adminFetch(slug, "/contact-messages", {
      method: "POST",
      body: JSON.stringify({ id, handled }),
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Inbox</h1>
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        <option value="">All messages</option>
        <option value="false">Unhandled</option>
        <option value="true">Handled</option>
      </select>
      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">From</th>
              <th className="px-4 py-2.5 text-left font-medium">Message</th>
              <th className="px-4 py-2.5 text-left font-medium">Received</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{m.name}</div>
                  <a href={`mailto:${m.email}`} className="text-xs text-[var(--brand)]">{m.email}</a>
                </td>
                <td className="max-w-md px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{m.subject ?? "(no subject)"}</div>
                  <div className="line-clamp-2 text-xs text-gray-500">{m.message}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {new Date(m.created_at).toLocaleString()}
                  {!m.handled && (
                    <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      New
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {m.handled ? (
                    <button onClick={() => mark(m.id, false)} className="rounded-lg bg-gray-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700">
                      Mark unhandled
                    </button>
                  ) : (
                    <button onClick={() => mark(m.id, true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      Mark handled
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

export default function AdminInboxPage() {
  return (
    <AdminShell>
      <InboxAdmin />
    </AdminShell>
  );
}
