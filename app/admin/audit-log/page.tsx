"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { TableWrap } from "@/components/admin/ui";

interface AuditEntry {
  id: string;
  admin_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

function AuditLogAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const res = await adminFetch<{ logs: AuditEntry[] }>(slug, "/audit-log?limit=200");
    if (res.ok && res.data?.logs) setRows(res.data.logs);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filter
    ? rows.filter((r) => r.action.toLowerCase().includes(filter.toLowerCase()))
    : rows;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Audit log</h1>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by action (e.g. balance, deposit, user)…"
          className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>
      <TableWrap empty={filtered.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">When</th>
              <th className="px-4 py-2.5 text-left font-medium">Admin</th>
              <th className="px-4 py-2.5 text-left font-medium">Action</th>
              <th className="px-4 py-2.5 text-left font-medium">Target</th>
              <th className="px-4 py-2.5 text-left font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{log.admin_email ?? "system"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700/60 dark:text-gray-200">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                  <div>{log.target_label ?? log.target_id ?? "--"}</div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-400">{log.target_type}</div>
                </td>
                <td className="max-w-xs truncate px-4 py-3 font-mono text-[10px] text-gray-500">
                  {JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

export default function AdminAuditLogPage() {
  return (
    <AdminShell>
      <AuditLogAdmin />
    </AdminShell>
  );
}
