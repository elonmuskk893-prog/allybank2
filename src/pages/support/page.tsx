"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import { bankFetch } from "@/lib/api";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "account", label: "Account" },
  { value: "transaction", label: "Transaction" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

const FAQS = [
  {
    q: "How to make a transfer?",
    a: "Go to the Transfer section and select Local or International transfer. Enter the recipient details, amount, and confirm with your PIN.",
    icon: "fa-paper-plane",
  },
  {
    q: "How to apply for a card?",
    a: "Visit the Cards section and click Apply for Virtual Card. Fill out the application form and wait for approval.",
    icon: "fa-credit-card",
  },
  {
    q: "How to check my balance?",
    a: "Your balance is displayed on the main dashboard. You can toggle visibility using the eye icon.",
    icon: "fa-wallet",
  },
  {
    q: "How to enable 2FA?",
    a: "Go to Settings → Security → Two-Factor Authentication and follow the setup instructions.",
    icon: "fa-shield",
  },
];

interface Ticket {
  id: number | string;
  subject?: string;
  category?: string;
  status: string;
  last_message?: string;
  last_message_at?: string;
  unread_for_user?: number;
}

interface TicketMessage {
  id: number | string;
  sender: "user" | "admin";
  body: string;
  created_at: string;
}

interface TicketsResponse {
  tickets: Ticket[];
}

interface TicketResponse {
  ticket: Ticket;
}

interface MessagesResponse {
  messages: TicketMessage[];
}

function statusInfo(status: string) {
  if ("resolved" === status) {
    return {
      label: "Resolved",
      cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    };
  }
  if ("in_progress" === status) {
    return {
      label: "In progress",
      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    };
  }
  return {
    label: "Open",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };
}

export default function SupportPage() {
  return (
    <AppShell>
      <SupportFlow />
    </AppShell>
  );
}

function SupportFlow() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState("list");
  const [activeId, setActiveId] = useState<number | string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [messageBody, setMessageBody] = useState("");
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadTickets = useCallback(async () => {
    const res = await bankFetch<TicketsResponse>("/support/tickets");
    if (res.ok && res.data) setTickets(res.data.tickets);
  }, []);

  const loadTicket = useCallback(async (id: number | string) => {
    const res = await bankFetch<TicketResponse & MessagesResponse>(
      `/support/tickets/${id}`,
    );
    if (res.ok && res.data) {
      setTicket(res.data.ticket);
      setMessages(res.data.messages);
    }
  }, []);

  async function submitTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!subject.trim() || messageBody.trim().length < 2) {
      setError("Add a title and describe your issue.");
      return;
    }
    setSubmitting(true);
    const res = await bankFetch<{ id: number | string }>("/support/tickets", {
      method: "POST",
      body: {
        category,
        subject: subject.trim(),
        message: messageBody.trim(),
      },
    });
    setSubmitting(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? "Couldn't submit -- try again.");
      return;
    }
    setSubject("");
    setMessageBody("");
    setCategory("general");
    setView("list");
    await loadTickets();
    setActiveId(res.data.id);
  }

  async function submitReply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (activeId == null || !reply.trim()) return;
    const text = reply.trim();
    setReply("");
    const res = await bankFetch(`/support/tickets/${activeId}/message`, {
      method: "POST",
      body: { body: text },
    });
    if (!res.ok) {
      setReply(text);
      return;
    }
    await loadTicket(activeId);
    loadTickets();
  }

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (activeId == null) return;
    loadTicket(activeId);
    const interval = setInterval(() => loadTicket(activeId), 7_000);
    return () => clearInterval(interval);
  }, [activeId, loadTicket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const card =
    "overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-lg backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/80";
  const inputClass =
    "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white";

  return (
    <div className="-mx-4 -my-5 min-h-screen space-y-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 lg:-mx-6 lg:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-2xl text-white"
                style={{ background: "var(--brand)" }}
              >
                <i className="fa-solid fa-life-ring text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Support</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Open a ticket and track our replies here.
                </p>
              </div>
            </div>
            {activeId == null && (
              <button
                type="button"
                onClick={() => {
                  setView("new" === view ? "list" : "new");
                  setError("");
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                <i
                  className={`fa-solid ${"new" === view ? "fa-xmark" : "fa-plus"} mr-2 text-xs`}
                />
                {"new" === view ? "Cancel" : "New ticket"}
              </button>
            )}
          </div>
        </div>

        {activeId != null ? (
          <div className={card}>
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setActiveId(null);
                  setTicket(null);
                  setMessages([]);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <i className="fa-solid fa-arrow-left mr-2" />
                Back
              </button>
              {ticket && (
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusInfo(ticket.status).cls}`}
                >
                  {statusInfo(ticket.status).label}
                </span>
              )}
            </div>
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700/50">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {ticket?.subject ?? `Ticket #${activeId}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {CATEGORIES.find((c) => c.value === ticket?.category)?.label ??
                  ticket?.category}
              </p>
            </div>
            <div className="max-h-[55vh] space-y-3 overflow-y-auto p-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${"user" === msg.sender ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${"user" === msg.sender ? "text-white" : "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100"}`}
                    style={"user" === msg.sender ? { background: "var(--brand)" } : undefined}
                  >
                    {"admin" === msg.sender && (
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        Support
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                    <p className="mt-0.5 text-[10px] opacity-60">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            {ticket?.status === "resolved" ? (
              <p className="border-t border-gray-100 p-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                This ticket is resolved. Open a new ticket if you need more help.
              </p>
            ) : (
              <form
                onSubmit={submitReply}
                className="flex gap-2 border-t border-gray-100 p-3 dark:border-gray-700"
              >
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply…"
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={!reply.trim()}
                  className="shrink-0 rounded-lg px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--brand)" }}
                >
                  <i className="fa-solid fa-paper-plane" />
                </button>
              </form>
            )}
          </div>
        ) : "new" === view ? (
          <div className={card}>
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                <i className="fa-solid fa-ticket mr-2 text-sm" style={{ color: "var(--brand)" }} />
                {" New support ticket"}
              </h2>
            </div>
            <form onSubmit={submitTicket} className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Subject
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Briefly describe your issue"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Describe your issue
                </label>
                <textarea
                  rows={5}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Please provide all relevant details"
                  className={inputClass}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--brand)" }}
              >
                {submitting ? (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <i className="fa-solid fa-paper-plane mr-2 text-xs" />
                )}
                {" Submit ticket"}
              </button>
            </form>
          </div>
        ) : (
          <div className={card}>
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your tickets
              </h2>
            </div>
            {0 === tickets.length ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <i className="fa-solid fa-inbox mb-2 block text-2xl text-gray-300" />
                {'No tickets yet. Open one with "New ticket".'}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {tickets.map((t) => {
                  const info = statusInfo(t.status);
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(t.id)}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {t.subject ?? `Ticket #${t.id}`}
                            </p>
                            {(t.unread_for_user ?? 0) > 0 && (
                              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {(t.unread_for_user ?? 0) > 9 ? "9+" : t.unread_for_user}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                            {t.last_message ?? "--"}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${info.cls}`}
                          >
                            {info.label}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {t.last_message_at
                              ? new Date(t.last_message_at).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activeId == null && "list" === view && (
          <div className={card}>
            <div className="flex items-center border-b border-gray-200/50 px-4 py-3 dark:border-gray-700/50">
              <div
                className="mr-3 grid h-8 w-8 place-items-center rounded-xl text-white"
                style={{ background: "var(--brand)" }}
              >
                <i className="fa-solid fa-question text-sm" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Help</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Find answers to common questions
                </p>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {FAQS.map((faq, index) => (
                <div key={index} className="p-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-start justify-between text-left"
                  >
                    <div className="flex flex-1 items-start gap-3">
                      <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-100 dark:bg-gray-700">
                        <i
                          className={`fa-solid ${faq.icon} text-sm text-gray-600 dark:text-gray-400`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {faq.q}
                        </p>
                        {openFaq === index && (
                          <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                            {faq.a}
                          </p>
                        )}
                      </div>
                    </div>
                    <i
                      className={`fa-solid ${openFaq === index ? "fa-chevron-up" : "fa-chevron-down"} ml-2 mt-1 text-xs text-gray-400`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}