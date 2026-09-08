"use client";

import { useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { TableWrap } from "@/components/admin/ui";

interface Referral {
  id: string;
  email?: string;
  name: string;
  code_used: string;
  joined_at: string;
  total_for_code: number;
}

function ReferralsAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<Referral[]>([]);

  useEffect(() => {
    (async () => {
      const res = await adminFetch<{ referrals: Referral[] }>(slug, "/referrals");
      if (res.ok && res.data?.referrals) setRows(res.data.referrals);
    })();
  }, [slug]);

  const topCodes = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.code_used] = (acc[r.code_used] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Referrals</h1>

      {topCodes.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {topCodes.map(([code, count]) => (
            <div key={code} className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
              <div className="truncate text-xs font-medium uppercase tracking-wider text-gray-500">Code</div>
              <div className="mt-1 truncate text-lg font-extrabold" style={{ color: "var(--brand)" }}>{code}</div>
              <div className="mt-1 text-xs text-gray-500">{count} sign-up{count === 1 ? "" : "s"}</div>
            </div>
          ))}
        </div>
      )}

      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Member</th>
              <th className="px-4 py-2.5 text-left font-medium">Code used</th>
              <th className="px-4 py-2.5 text-left font-medium">Sign-ups with code</th>
              <th className="px-4 py-2.5 text-left font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.email}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{r.code_used}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.total_for_code}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(r.joined_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

export default function AdminReferralsPage() {
  return (
    <AdminShell>
      <ReferralsAdmin />
    </AdminShell>
  );
}
