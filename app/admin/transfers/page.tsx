"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Pill, TableWrap } from "@/components/admin/ui";

interface Transfer {
  id: string;
  email?: string;
  kind: string;
  direction: string;
  amount: string;
  currency: string;
  name: string | null;
  reference: string | null;
  status: string;
  created_at: string;
  confirmation_code?: string | null;
  confirmation_code_generated_at?: string | null;
  confirmation_code_expires_at?: string | null;
  confirmation_code_used_at?: string | null;
}

const STATUSES = ["", "pending", "completed", "failed", "cancelled"];

function TransfersAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<Transfer[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    const res = await adminFetch<{ transfers: Transfer[] }>(slug, `/transfers?${params}`);
    if (res.ok && res.data?.transfers) {
      setLoadedAt(Date.now());
      setRows(res.data.transfers);
    }
  }, [slug, query, status]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, next: string) => {
    setBusyId(id);
    await adminFetch(slug, "/transfers", {
      method: "POST",
      body: JSON.stringify({ id, status: next }),
    });
    await load();
    setBusyId(null);
  };

  // Confirmation-code expiry is evaluated against the load-time clock.
  function codeStatusOf(t: Transfer): { label: string; cls: string } {
    if (!t.confirmation_code) return { label: "none", cls: "text-gray-400" };
    if (t.confirmation_code_used_at) return { label: "used", cls: "text-gray-500" };
    if (
      t.confirmation_code_expires_at &&
      new Date(t.confirmation_code_expires_at).getTime() < loadedAt
    ) {
      return { label: "expired", cls: "text-rose-600" };
    }
    return { label: "active", cls: "text-emerald-600" };
  }

  const generateCode = async (id: string) => {
    setBusyId(id);
    await adminFetch(slug, "/transfers", {
      method: "POST",
      body: JSON.stringify({ action: "generate-code", id }),
    });
    await load();
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Transfers</h1>
      <div className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search by user or reference…"
          className="w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === "" ? "All statuses" : s}</option>
          ))}
        </select>
      </div>
      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">User</th>
              <th className="px-4 py-2.5 text-left font-medium">Description</th>
              <th className="px-4 py-2.5 text-left font-medium">Amount</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-left font-medium">Confirmation</th>
              <th className="px-4 py-2.5 text-left font-medium">Date</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{t.email ?? "--"}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  <div>{t.name ?? t.kind}</div>
                  {t.reference && <div className="text-xs text-gray-500">{t.reference}</div>}
                </td>
                <td className={`px-4 py-3 font-semibold ${t.direction === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
                  {t.currency} {Number(t.amount).toLocaleString()}
                </td>
                <td className="px-4 py-3"><Pill status={t.status} /></td>
                <td className="px-4 py-3">
                  {(() => {
                    const cs = codeStatusOf(t);
                    return (
                      <>
                        <span className={`text-xs font-semibold capitalize ${cs.cls}`}>{cs.label}</span>
                        {t.confirmation_code && !t.confirmation_code_used_at && (
                          <div className="mt-0.5 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                await navigator.clipboard.writeText(t.confirmation_code as string);
                                setCopiedId(t.id);
                                setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="font-mono text-xs font-bold tracking-wider text-gray-900 underline decoration-dotted dark:text-white"
                              title="Click to copy"
                            >
                              {t.confirmation_code}
                            </button>
                            {copiedId === t.id && <span className="text-[10px] text-emerald-600">copied</span>}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  {t.status === "pending" ? (
                    <>
                      <button disabled={busyId === t.id} onClick={() => act(t.id, "completed")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                        Complete
                      </button>
                      <button disabled={busyId === t.id} onClick={() => act(t.id, "failed")} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                        Fail
                      </button>
                      <button
                        disabled={busyId === t.id || Boolean(t.confirmation_code_used_at)}
                        onClick={() => generateCode(t.id)}
                        title={t.confirmation_code ? `Regenerate (current: ${t.confirmation_code})` : "Generate confirmation code"}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {t.confirmation_code ? "Regenerate code" : "Generate code"}
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
      </TableWrap>
    </div>
  );
}

export default function AdminTransfersPage() {
  return (
    <AdminShell>
      <TransfersAdmin />
    </AdminShell>
  );
}
