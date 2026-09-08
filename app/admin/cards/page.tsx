"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";

interface CardRow {
  id: string;
  user_id: string;
  email?: string;
  brand: string;
  card_type: string;
  last4: string;
  holder: string;
  expiry: string;
  status: string;
  limit_amount: string | null;
  spent: string;
  frozen: boolean;
  created_at: string;
}

interface CardApplicationRow {
  id: string;
  user_id: string;
  email?: string;
  card_type: string;
  status: string;
  created_at: string;
}

function statusPill(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300",
    blocked: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    declined: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    closed: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300";
}

function AdminCards() {
  const { slug } = useAdmin();
  const [cards, setCards] = useState<CardRow[]>([]);
  const [applications, setApplications] = useState<CardApplicationRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch<{ cards: CardRow[]; applications: CardApplicationRow[] }>(slug, "/cards");
    if (res.ok && res.data) {
      setCards(res.data.cards ?? []);
      setApplications(res.data.applications ?? []);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (body: Record<string, unknown>) => {
    setBusyId(String(body.id));
    await adminFetch(slug, "/cards", { method: "POST", body: JSON.stringify(body) });
    await load();
    setBusyId(null);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Cards</h1>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Card applications</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200/70 bg-white backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800">
          {applications.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No pending applications.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">User</th>
                  <th className="px-4 py-2.5 text-left font-medium">Card type</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Date</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{app.email ?? app.user_id}</td>
                    <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{app.card_type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPill(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                      {app.status === "pending" ? (
                        <>
                          <button
                            disabled={busyId === app.id}
                            onClick={() => act({ kind: "application", id: app.id, status: "approved" })}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Approve & issue
                          </button>
                          <button
                            disabled={busyId === app.id}
                            onClick={() => act({ kind: "application", id: app.id, status: "declined" })}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Issued cards</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200/70 bg-white backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800">
          {cards.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No cards issued.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">User</th>
                  <th className="px-4 py-2.5 text-left font-medium">Card</th>
                  <th className="px-4 py-2.5 text-left font-medium">Expiry</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Spent / Limit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{card.email ?? card.user_id}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <div className="font-medium capitalize text-gray-900 dark:text-gray-100">{card.brand} •••• {card.last4}</div>
                      <div className="text-xs capitalize text-gray-500">{card.card_type}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{card.expiry}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusPill(card.status)} ${card.frozen ? "line-through" : ""}`}>
                        {card.frozen ? "frozen" : card.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {Number(card.spent).toLocaleString()} / {card.limit_amount ? Number(card.limit_amount).toLocaleString() : "--"}
                    </td>
                    <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                      <button
                        disabled={busyId === card.id}
                        onClick={() => act({ kind: "card", id: card.id, frozen: !card.frozen })}
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
                      >
                        {card.frozen ? "Unfreeze" : "Freeze"}
                      </button>
                      {card.status !== "closed" && card.status !== "blocked" ? (
                        <>
                          <button
                            disabled={busyId === card.id}
                            onClick={() => act({ kind: "card", id: card.id, status: "blocked" })}
                            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                          >
                            Block
                          </button>
                          <button
                            disabled={busyId === card.id}
                            onClick={() => act({ kind: "card", id: card.id, status: "closed" })}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                          >
                            Close
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={busyId === card.id}
                          onClick={() => act({ kind: "card", id: card.id, status: "active" })}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

export default function AdminCardsPage() {
  return (
    <AdminShell>
      <AdminCards />
    </AdminShell>
  );
}
