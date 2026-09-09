"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Modal, Pill, TableWrap, inputCls } from "@/components/admin/ui";

interface Ticket {
  id: string;
  email?: string;
  subject: string;
  category?: string;
  status: string;
  created_at: string;
  message_count: number;
  last_message: string | null;
  last_message_at: string;
}

interface TicketMessage {
  id: string;
  body: string;
  sender: string;
  from: string;
  created_at: string;
}

function TicketsAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ ticket: Ticket; messages: TicketMessage[] } | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch<{ tickets: Ticket[] }>(slug, `/tickets${statusFilter ? `?status=${statusFilter}` : ""}`);
    if (res.ok && res.data?.tickets) setRows(res.data.tickets);
  }, [slug, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (id: string) => {
    setOpenId(id);
    const res = await adminFetch<{ ticket: Ticket; messages: TicketMessage[] }>(slug, `/tickets?id=${id}`);
    if (res.ok && res.data) setDetail(res.data);
  };

  const sendReply = async () => {
    if (!openId || !reply.trim()) return;
    setSending(true);
    await adminFetch(slug, "/tickets", {
      method: "POST",
      body: JSON.stringify({ action: "reply", id: openId, body: reply }),
    });
    setReply("");
    setSending(false);
    await open(openId);
    await load();
  };

  const setStatus = async (id: string, status: string) => {
    await adminFetch(slug, "/tickets", { method: "POST", body: JSON.stringify({ id, status }) });
    await load();
    if (openId === id && detail) {
      setDetail({ ...detail, ticket: { ...detail.ticket, status } });
    }
  };

  const remove = async (id: string) => {
    await adminFetch(slug, "/tickets", { method: "POST", body: JSON.stringify({ action: "delete", id }) });
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
    }
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Support tickets</h1>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        <option value="">All statuses</option>
        <option value="open">open</option>
        <option value="pending">pending</option>
        <option value="closed">closed</option>
      </select>
      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Member</th>
              <th className="px-4 py-2.5 text-left font-medium">Subject</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-left font-medium">Last message</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{t.email ?? "--"}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{t.subject}</div>
                  <div className="max-w-xs truncate text-xs text-gray-500">{t.last_message ?? "No messages"}</div>
                </td>
                <td className="px-4 py-3"><Pill status={t.status} /></td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(t.last_message_at).toLocaleString()}</td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => open(t.id)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                    Open
                  </button>
                  {t.status !== "closed" ? (
                    <button onClick={() => setStatus(t.id, "closed")} className="rounded-lg bg-gray-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700">
                      Close
                    </button>
                  ) : (
                    <button onClick={() => remove(t.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {detail && (
        <Modal title={detail.ticket.subject} onClose={() => { setOpenId(null); setDetail(null); }}>
          <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
            <span>{detail.ticket.email}</span>
            <Pill status={detail.ticket.status} />
          </div>
          <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
            {detail.messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === "admin" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.from === "admin"
                      ? "bg-sky-600 text-white"
                      : "bg-white text-gray-900 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-700"
                  }`}
                >
                  {m.body}
                  <div className={`mt-1 text-[10px] ${m.from === "admin" ? "text-white/70" : "text-gray-400"}`}>
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            <textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply…" className={inputCls} />
            <div className="flex gap-2">
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--brand)" }}
              >
                {sending ? "Sending…" : "Send reply"}
              </button>
              {detail.ticket.status !== "closed" && (
                <button
                  onClick={() => setStatus(detail.ticket.id, "closed")}
                  className="rounded-xl bg-gray-600 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700"
                >
                  Close ticket
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminTicketsPage() {
  return (
    <AdminShell>
      <TicketsAdmin />
    </AdminShell>
  );
}
