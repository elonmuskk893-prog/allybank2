"use client";

import Link from "@/lib/next/link";
import { useParams, useRouter } from "@/lib/next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch, bankFetch } from "@/lib/api";
import { parseAmountInput } from "@/lib/utils";
import { Field, inputCls, Modal, Pill } from "@/components/admin/ui";

interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country?: string;
  photo_url?: string;
  status: string;
  kyc_status: string;
  role?: string;
  email_verified_at: string | null;
  account_number: string | null;
  created_at: string;
}

interface AccountRow {
  id: string;
  currency: string;
  balance: string | number;
  available: string | number;
}

interface TxnRow {
  id: string;
  kind: string;
  direction: "credit" | "debit";
  amount: string;
  currency: string;
  name: string | null;
  reference: string | null;
  status: string;
  created_at: string;
}

interface CardRow {
  id: string;
  brand: string;
  last4: string;
  status: string;
  frozen: boolean;
}

const STATUS_OPTIONS = ["active", "suspended", "disabled"];
const KYC_OPTIONS = ["not_submitted", "in_review", "verified", "rejected"];

function AdminUserDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { slug } = useAdmin();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [txns, setTxns] = useState<TxnRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", phone: "", country: "" });
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [balanceForm, setBalanceForm] = useState({ direction: "credit", amount: "", currency: "USD", reason: "" });
  const [txnOpen, setTxnOpen] = useState(false);
  const [txnForm, setTxnForm] = useState({ kind: "adjustment", direction: "credit", amount: "", name: "" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [txnDelete, setTxnDelete] = useState<TxnRow | null>(null);
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch<{
      user: AdminUser;
      accounts: AccountRow[];
      transactions: TxnRow[];
      cards: CardRow[];
    }>(slug, `/users/${params.id}`);
    if (res.ok && res.data?.user) {
      setUser(res.data.user);
      setAccounts(res.data.accounts ?? []);
      setTxns(res.data.transactions ?? []);
      setCards(res.data.cards ?? []);
      setEditForm({
        first_name: res.data.user.first_name ?? "",
        last_name: res.data.user.last_name ?? "",
        phone: res.data.user.phone ?? "",
        country: res.data.user.country ?? "",
      });
    } else {
      setNotFound(true);
    }
  }, [slug, params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="rounded-2xl border border-gray-200/70 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700/50 dark:bg-gray-800">
        User not found.{" "}
        <Link href="/admin/users" className="text-[var(--brand)]">
          Back to users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="text-sm text-[var(--brand)] hover:underline">
        ← All users
      </Link>

      {user && (
        <>
          <section className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {user.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <span
                    className="grid h-14 w-14 place-items-center rounded-full text-lg font-bold text-white"
                    style={{ background: "var(--brand)" }}
                  >
                    {(user.first_name ?? user.email).slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email}
                    {user.role === "admin" && (
                      <span className="ml-2 rounded-md bg-[var(--brand)] px-2 py-0.5 text-[10px] font-bold uppercase text-white">Admin</span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setImpersonateOpen(true)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-white"
                  style={{ background: "var(--brand)" }}
                >
                  <i className="fa-solid fa-user-secret mr-1.5" /> Login as User
                </button>
                <button onClick={() => setEditOpen(true)} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700">
                  Edit details
                </button>
                <button onClick={() => setBalanceOpen(true)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                  Adjust balance
                </button>
                <button onClick={() => setTxnOpen(true)} className="rounded-lg px-3 py-2 text-xs font-semibold text-white" style={{ background: "var(--brand)" }}>
                  Create transaction
                </button>
                {user.role !== "admin" && (
                  <button onClick={() => setDeleteOpen(true)} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">
                    Delete account
                  </button>
                )}
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4 lg:grid-cols-6">
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-400">Status</dt>
                <dd className="mt-1">
                  <select
                    value={user.status}
                    disabled={busy}
                    onChange={(e) =>
                      run(async () => {
                        await adminFetch(slug, "/user-status", {
                          method: "POST",
                          body: JSON.stringify({ id: user.id, status: e.target.value }),
                        });
                        await load();
                      })
                    }
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-400">KYC</dt>
                <dd className="mt-1">
                  <select
                    value={user.kyc_status}
                    disabled={busy}
                    onChange={(e) =>
                      run(async () => {
                        await adminFetch(slug, `/users/${user.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ kyc_status: e.target.value }),
                        });
                        await load();
                      })
                    }
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    {KYC_OPTIONS.map((s) => (
                      <option key={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-400">Email</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <Pill status={user.email_verified_at ? "verified" : "pending"} />
                  {!user.email_verified_at && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await adminFetch(slug, `/users/${user.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ email_verified: true }),
                          });
                          await load();
                        })
                      }
                      className="text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      Verify
                    </button>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-400">Account #</dt>
                <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">{user.account_number ?? "--"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-400">Phone</dt>
                <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">{user.phone ?? "--"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-400">Joined</dt>
                <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">{new Date(user.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Balances</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
                  <div className="text-xs font-medium uppercase tracking-wider text-gray-500">{acc.currency} balance</div>
                  <div className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    {Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <div className="rounded-2xl border border-gray-200/70 bg-white p-5 text-sm text-gray-500 dark:border-gray-700/50 dark:bg-gray-800">
                  No accounts.
                </div>
              )}
            </div>
          </section>

          {cards.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cards</h2>
              <div className="overflow-x-auto rounded-2xl border border-gray-200/70 bg-white dark:border-gray-700/50 dark:bg-gray-800">
                <table className="w-full text-sm">
                  <tbody>
                    {cards.map((card) => (
                      <tr key={card.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                        <td className="px-4 py-3 font-medium capitalize text-gray-900 dark:text-gray-100">
                          {card.brand} •••• {card.last4}
                        </td>
                        <td className="px-4 py-3"><Pill status={card.frozen ? "frozen" : card.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <button
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                await adminFetch(slug, "/cards", {
                                  method: "POST",
                                  body: JSON.stringify({ kind: "card", id: card.id, frozen: !card.frozen }),
                                });
                                await load();
                              })
                            }
                            className="mr-2 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                          >
                            {card.frozen ? "Unfreeze" : "Freeze"}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                await adminFetch(slug, "/cards", {
                                  method: "POST",
                                  body: JSON.stringify({ kind: "card", id: card.id, status: card.status === "blocked" ? "active" : "blocked" }),
                                });
                                await load();
                              })
                            }
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${card.status === "blocked" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
                          >
                            {card.status === "blocked" ? "Unblock" : "Block"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Transaction history</h2>
            <div className="overflow-x-auto rounded-2xl border border-gray-200/70 bg-white backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800">
              {txns.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No transactions.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Name</th>
                      <th className="px-4 py-2.5 text-left font-medium">Kind</th>
                      <th className="px-4 py-2.5 text-left font-medium">Reference</th>
                      <th className="px-4 py-2.5 text-left font-medium">Amount</th>
                      <th className="px-4 py-2.5 text-left font-medium">Status</th>
                      <th className="px-4 py-2.5 text-left font-medium">Date</th>
                      <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((t) => (
                      <tr key={t.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{t.name ?? t.kind}</td>
                        <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{t.kind.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{t.reference ?? "--"}</td>
                        <td className={`px-4 py-3 font-semibold ${t.direction === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
                          {t.direction === "credit" ? "+" : "-"}
                          {Number(t.amount).toLocaleString()} {t.currency}
                        </td>
                        <td className="px-4 py-3"><Pill status={t.status} /></td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            disabled={busy}
                            onClick={() => setTxnDelete(t)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Edit profile modal */}
          {editOpen && (
            <Modal title="Edit member details" onClose={() => setEditOpen(false)}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name">
                    <input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Last name">
                    <input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone">
                    <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Country">
                    <input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await adminFetch(slug, `/users/${user.id}`, {
                        method: "PATCH",
                        body: JSON.stringify(editForm),
                      });
                      setEditOpen(false);
                      await load();
                    })
                  }
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
                  style={{ background: "var(--brand)" }}
                >
                  Save changes
                </button>
              </div>
            </Modal>
          )}

          {/* Adjust balance modal */}
          {balanceOpen && (
            <Modal title="Adjust balance" onClose={() => setBalanceOpen(false)}>
              <p className="mb-3 text-xs text-gray-500">
                Adds or deducts funds immediately and records a transaction + audit entry.
              </p>
              <div className="space-y-3">
                <Field label="Direction">
                  <select value={balanceForm.direction} onChange={(e) => setBalanceForm({ ...balanceForm, direction: e.target.value })} className={inputCls}>
                    <option value="credit">Credit (add funds)</option>
                    <option value="debit">Debit (deduct funds)</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Amount *">
                    <input type="number" step="any" min="0.01" value={balanceForm.amount} onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Currency">
                    <select value={balanceForm.currency} onChange={(e) => setBalanceForm({ ...balanceForm, currency: e.target.value })} className={inputCls}>
                      {(accounts.length > 0 ? accounts.map((a) => a.currency) : ["USD"]).map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Reason (recorded in audit trail)">
                  <input value={balanceForm.reason} onChange={(e) => setBalanceForm({ ...balanceForm, reason: e.target.value })} className={inputCls} placeholder="Manual correction" />
                </Field>
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
                <button
                  disabled={busy || !balanceForm.amount}
                  onClick={() =>
                    run(async () => {
                      const res = await adminFetch(slug, "/adjust-balance", {
                        method: "POST",
                        body: JSON.stringify({ ...balanceForm, amount: parseAmountInput(balanceForm.amount), user_id: user.id }),
                      });
                      if (!res.ok) {
                        setError(res.error ?? "Adjustment failed.");
                        return;
                      }
                      setBalanceOpen(false);
                      setBalanceForm({ direction: "credit", amount: "", currency: "USD", reason: "" });
                      await load();
                    })
                  }
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
                  style={{ background: "var(--brand)" }}
                >
                  Apply adjustment
                </button>
              </div>
            </Modal>
          )}

          {/* Create transaction modal */}
          {txnOpen && (
            <Modal title="Create transaction for member" onClose={() => setTxnOpen(false)}>
              <div className="space-y-3">
                <Field label="Kind">
                  <select value={txnForm.kind} onChange={(e) => setTxnForm({ ...txnForm, kind: e.target.value })} className={inputCls}>
                    {["deposit", "withdrawal", "transfer", "credited", "grant", "adjustment"].map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Direction">
                    <select value={txnForm.direction} onChange={(e) => setTxnForm({ ...txnForm, direction: e.target.value })} className={inputCls}>
                      <option value="credit">Credit</option>
                      <option value="debit">Debit</option>
                    </select>
                  </Field>
                  <Field label="Amount *">
                    <input type="number" step="any" min="0.01" value={txnForm.amount} onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <Field label="Description">
                  <input value={txnForm.name} onChange={(e) => setTxnForm({ ...txnForm, name: e.target.value })} className={inputCls} placeholder="Promo bonus" />
                </Field>
                <p className="text-xs text-gray-500">The balance effect is applied automatically and logged to the audit trail.</p>
                <button
                  disabled={busy || !txnForm.amount}
                  onClick={() =>
                    run(async () => {
                      const res = await adminFetch(slug, "/transactions-create", {
                        method: "POST",
                        body: JSON.stringify({
                          ...txnForm,
                          amount: parseAmountInput(txnForm.amount),
                          user_id: user.id,
                          apply_balance: true,
                        }),
                      });
                      if (!res.ok) {
                        setError(res.error ?? "Could not create the transaction.");
                        return;
                      }
                      setTxnOpen(false);
                      setTxnForm({ kind: "adjustment", direction: "credit", amount: "", name: "" });
                      await load();
                    })
                  }
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
                  style={{ background: "var(--brand)" }}
                >
                  Create transaction
                </button>
              </div>
            </Modal>
          )}

          {/* Impersonate confirm modal */}
          {impersonateOpen && (
            <Modal title="Login as this user?" onClose={() => setImpersonateOpen(false)}>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                You will be signed in to{" "}
                <strong>{user.email}</strong>
                {" "}with full view of their dashboard — no password required.
                The session is time-limited and every start/stop is recorded in the audit log.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Your admin session stays active; use the prominent{" "}
                <strong>Exit to admin</strong> banner at the top of the dashboard to return.
              </p>
              {error && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setImpersonateOpen(false)}
                  className="flex-1 rounded-xl bg-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const res = await bankFetch<{ redirect?: string }>("/auth/impersonate", {
                        method: "POST",
                        body: { id: user.id },
                      });
                      if (!res.ok) {
                        setError(res.error ?? "Could not start impersonation.");
                        return;
                      }
                      window.location.href = "/dashboard";
                    })
                  }
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
                  style={{ background: "var(--brand)" }}
                >
                  Start impersonation
                </button>
              </div>
            </Modal>
          )}

          {/* Delete transaction confirm modal */}
          {txnDelete && (
            <Modal title="Delete this transaction?" onClose={() => setTxnDelete(null)}>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Permanently remove{" "}
                <strong>
                  {txnDelete.name ?? txnDelete.kind} — {txnDelete.currency}{" "}
                  {Number(txnDelete.amount).toLocaleString()}
                </strong>{" "}
                from this member&apos;s history? It will disappear from their dashboard
                immediately. The removal is recorded in the audit log and cannot be undone.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setTxnDelete(null)}
                  className="flex-1 rounded-xl bg-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await adminFetch(slug, `/transactions?id=${txnDelete.id}`, {
                        method: "DELETE",
                      });
                      setTxnDelete(null);
                      await load();
                    })
                  }
                  className="flex-1 rounded-xl bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Delete permanently
                </button>
              </div>
            </Modal>
          )}

          {/* Delete confirm modal */}
          {deleteOpen && (
            <Modal title="Delete this account?" onClose={() => setDeleteOpen(false)}>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                This permanently deletes <strong>{user.email}</strong> with all balances, cards and history.
                The action is recorded in the audit log and cannot be undone.
              </p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setDeleteOpen(false)} className="flex-1 rounded-xl bg-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200">
                  Cancel
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const res = await adminFetch(slug, `/users/${user.id}`, { method: "DELETE" });
                      if (!res.ok) {
                        setError(res.error ?? "Deletion failed.");
                        return;
                      }
                      router.replace("/admin/users");
                    })
                  }
                  className="flex-1 rounded-xl bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Delete permanently
                </button>
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminUserDetailPage() {
  return (
    <AdminShell>
      <AdminUserDetail />
    </AdminShell>
  );
}
