"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Modal, Pill } from "@/components/admin/ui";

interface WithdrawalRow {
  id: string;
  user_id: string;
  email?: string;
  full_name?: string;
  method: string;
  amount: string;
  currency: string;
  account_number: string | null;
  reference: string | null;
  status: string;
  created_at: string;
  otp_verified_at?: string | null;
  confirmation_code?: string | null;
  confirmation_code_generated_at?: string | null;
  confirmation_code_expires_at?: string | null;
  confirmation_code_used_at?: string | null;
}

const STATUS_OPTIONS = ["", "pending", "processing", "completed", "rejected", "failed"];

function statusPill(status: string) {
  const map: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    processing: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    failed: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300";
}

interface CodeState {
  code?: string;
  generated_at?: string;
  expires_at?: string;
}

function WithdrawalsAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [codeInfo, setCodeInfo] = useState<CodeState | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    const res = await adminFetch<{ withdrawals: WithdrawalRow[] }>(slug, `/withdrawals?${params}`);
    if (res.ok && res.data?.withdrawals) {
      setLoadedAt(Date.now());
      setRows(res.data.withdrawals);
    }
  }, [slug, query, status]);

  useEffect(() => {
    load();
  }, [load]);

  const detail = rows.find((r) => r.id === detailId) ?? null;

  const act = async (id: string, nextStatus: string) => {
    setBusyId(id);
    await adminFetch(slug, "/withdrawals", {
      method: "POST",
      body: JSON.stringify({ id, status: nextStatus }),
    });
    await load();
    setBusyId(null);
  };

  const generateCode = async (id: string) => {
    setBusyId(id);
    setCodeError(null);
    const res = await adminFetch<CodeState>(slug, "/withdrawals", {
      method: "POST",
      body: JSON.stringify({ action: "generate-code", id }),
    });
    setBusyId(null);
    if (!res.ok || !res.data) {
      setCodeError(res.error ?? "Could not generate the code.");
      return;
    }
    setCodeInfo({ code: res.data.code, generated_at: res.data.generated_at, expires_at: res.data.expires_at });
    await load();
  };

  const openDetail = (w: WithdrawalRow) => {
    setDetailId(w.id);
    setCodeError(null);
    setCopiedId(null);
    setCodeInfo(null);
  };

  const copyCode = async () => {
    const code = codeInfo?.code ?? detail?.confirmation_code;
    if (!code || !detail) return;
    await navigator.clipboard.writeText(code);
    setCopiedId(detail.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Expiry is evaluated against the load-time clock; refreshes on each fetch.
  const nowMs = loadedAt;
  function codeStatusOf(w: WithdrawalRow): { label: string; cls: string } {
    if (w.confirmation_code_used_at) return { label: "used", cls: "text-gray-500" };
    if (
      w.confirmation_code &&
      w.confirmation_code_expires_at &&
      new Date(w.confirmation_code_expires_at).getTime() < nowMs
    ) {
      return { label: "expired", cls: "text-rose-600" };
    }
    if (w.confirmation_code) return { label: "active", cls: "text-emerald-600" };
    return { label: "none", cls: "text-gray-400" };
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Withdrawals</h1>
      <div className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load();
          }}
          placeholder="Search by email or method…"
          className="w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-gray-200/70 bg-white backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No withdrawals found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">User</th>
                <th className="px-4 py-2.5 text-left font-medium">Amount</th>
                <th className="px-4 py-2.5 text-left font-medium">Destination</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Confirmation</th>
                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const cs = codeStatusOf(row);
                return (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-black/[0.02] dark:border-gray-700/60 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.email ?? row.user_id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      {row.currency} {Number(row.amount).toLocaleString()}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-xs text-gray-500">
                      {row.account_number ?? row.method}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPill(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold capitalize ${cs.cls}`}>{cs.label}</span>
                      {row.confirmation_code && !row.confirmation_code_used_at && (
                        <div className="mt-0.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={async () => {
                              await navigator.clipboard.writeText(row.confirmation_code as string);
                              setCopiedId(row.id);
                              setTimeout(() => setCopiedId(null), 1500);
                            }}
                            className="font-mono text-xs font-bold tracking-wider text-gray-900 underline decoration-dotted dark:text-white"
                            title="Click to copy"
                          >
                            {row.confirmation_code}
                          </button>
                          {copiedId === row.id && <span className="text-[10px] text-emerald-600">copied</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openDetail(row)}
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
                      >
                        Manage
                      </button>
                      {row.status !== "completed" ? (
                        <button
                          disabled={busyId === row.id}
                          onClick={() => act(row.id, "completed")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      ) : null}
                      {row.status === "pending" || row.status === "processing" ? (
                        <button
                          disabled={busyId === row.id}
                          onClick={() => act(row.id, "rejected")}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                        >
                          Reject & refund
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail / confirmation-code modal */}
      {detail && (
        <Modal title="Withdrawal details" onClose={() => setDetailId(null)}>
          <dl className="space-y-2 text-sm">
            {[
              ["Withdrawal ID", detail.id],
              ["Reference", detail.reference ?? "--"],
              ["Member", detail.full_name || "--"],
              ["Email", detail.email ?? detail.user_id],
              [
                "Amount",
                `${detail.currency} ${Number(detail.amount).toLocaleString()}`,
              ],
              ["Method", detail.method.replace(/_/g, " ")],
              ["Destination", detail.account_number ?? "--"],
              ["Requested", new Date(detail.created_at).toLocaleString()],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-6 border-b border-gray-100 pb-1.5 dark:border-gray-800">
                <dt className="shrink-0 text-xs uppercase tracking-wider text-gray-400">{k}</dt>
                <dd className="break-all text-right font-medium text-gray-900 dark:text-gray-100">{v}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 dark:border-gray-800">
              <dt className="text-xs uppercase tracking-wider text-gray-400">Current status</dt>
              <dd><Pill status={detail.status} /></dd>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 dark:border-gray-800">
              <dt className="text-xs uppercase tracking-wider text-gray-400">Confirmation status</dt>
              <dd className="font-semibold capitalize">
                {(() => {
                  const cs = codeStatusOf(detail);
                  return <span className={cs.cls}>{cs.label}</span>;
                })()}
                {detail.confirmation_code_used_at && (
                  <span className="block text-xs text-gray-400">
                    used {new Date(detail.confirmation_code_used_at).toLocaleString()}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {(codeInfo?.code || detail.confirmation_code) && !detail.confirmation_code_used_at && (
            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-center dark:bg-gray-800/70">
              <div className="text-xs uppercase tracking-wider text-gray-400">Confirmation code</div>
              <div className="my-2 font-mono text-3xl font-bold tracking-[0.35em]" style={{ color: "var(--brand)" }}>
                {codeInfo?.code ?? detail.confirmation_code}
              </div>
              <div className="text-xs text-gray-500">
                {codeInfo?.expires_at || detail.confirmation_code_expires_at
                  ? `Expires ${new Date((codeInfo?.expires_at ?? detail.confirmation_code_expires_at) as string).toLocaleString()}`
                  : ""}
              </div>
              <button
                onClick={copyCode}
                className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white"
                style={{ background: "var(--brand)" }}
              >
                <i className="fa-solid fa-copy" /> {copiedId === detail.id ? "Copied!" : "Copy code"}
              </button>
            </div>
          )}

          {detail.confirmation_code_generated_at && (
            <p className="mt-3 text-xs text-gray-400">
              Generated {new Date(detail.confirmation_code_generated_at).toLocaleString()}
            </p>
          )}

          {codeError && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{codeError}</p>}

          <div className="mt-4 space-y-2">
            {detail.status === "pending" ? (
              <button
                disabled={busyId === detail.id || Boolean(detail.confirmation_code_used_at)}
                onClick={() => generateCode(detail.id)}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--brand)" }}
              >
                {busyId === detail.id
                  ? "Generating…"
                  : detail.confirmation_code
                    ? "Regenerate code"
                    : "Generate confirmation code"}
              </button>
            ) : (
              <p className="text-center text-xs text-gray-400">
                Codes can only be generated while the withdrawal is pending.
              </p>
            )}
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              Share this code with the member — they enter it on the withdrawal screen to complete the transfer.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminWithdrawalsPage() {
  return (
    <AdminShell>
      <WithdrawalsAdmin />
    </AdminShell>
  );
}
