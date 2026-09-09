"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";

interface GrantRow {
  id: string;
  user_id: string;
  email?: string;
  program: string;
  amount: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ["", "pending", "approved", "rejected", "completed"];

function statusPill(status: string) {
  const map: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300";
}

function AdminGrants() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<GrantRow[]>([]);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await adminFetch<{ grants: GrantRow[] }>(slug, `/grants?${params}`);
    if (res.ok && res.data?.grants) setRows(res.data.grants);
  }, [slug, status]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, nextStatus: string) => {
    setBusyId(id);
    await adminFetch(slug, "/grants", {
      method: "POST",
      body: JSON.stringify({ id, status: nextStatus }),
    });
    await load();
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Grants</h1>
      <div className="flex flex-wrap gap-3">
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
          <div className="p-8 text-center text-sm text-gray-500">No grant applications found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">User</th>
                <th className="px-4 py-2.5 text-left font-medium">Program</th>
                <th className="px-4 py-2.5 text-left font-medium">Amount</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-black/[0.02] dark:border-gray-700/60 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.email ?? row.user_id}</td>
                  <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{row.program.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                    {row.amount ? Number(row.amount).toLocaleString() : "--"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPill(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                    {row.status === "pending" ? (
                      <>
                        <button
                          disabled={busyId === row.id}
                          onClick={() => act(row.id, "approved")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={busyId === row.id}
                          onClick={() => act(row.id, "rejected")}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                        >
                          Reject
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
    </div>
  );
}

export default function AdminGrantsPage() {
  return (
    <AdminShell>
      <AdminGrants />
    </AdminShell>
  );
}
