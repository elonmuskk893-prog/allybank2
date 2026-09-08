"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Modal, Pill, TableWrap } from "@/components/admin/ui";

interface KycSubmission {
  user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  kyc_status: string;
  created_at: string;
  kyc: Record<string, unknown>;
}

function KycAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<KycSubmission[]>([]);
  const [detail, setDetail] = useState<KycSubmission | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch<{ submissions: KycSubmission[] }>(slug, "/kyc");
    if (res.ok && res.data?.submissions) setRows(res.data.submissions);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (userId: string, status: string) => {
    await adminFetch(slug, "/kyc", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, status }),
    });
    setDetail(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">KYC</h1>
      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">User</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-left font-medium">Submitted</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.user_id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {`${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || row.email}
                  </div>
                  <div className="text-xs text-gray-500">{row.email}</div>
                </td>
                <td className="px-4 py-3"><Pill status={row.kyc_status} /></td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(row.created_at).toLocaleDateString()}</td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => setDetail(row)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                    Review
                  </button>
                  {row.kyc_status !== "verified" && (
                    <button onClick={() => setStatus(row.user_id, "verified")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      Approve
                    </button>
                  )}
                  {row.kyc_status !== "rejected" && (
                    <button onClick={() => setStatus(row.user_id, "rejected")} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {detail && (
        <Modal title={`KYC details — ${detail.email}`} onClose={() => setDetail(null)}>
          <dl className="space-y-2 text-sm">
            {Object.entries(detail.kyc).length === 0 && (
              <p className="text-gray-500">No submission details recorded.</p>
            )}
            {Object.entries(detail.kyc).map(([key, value]) => (
              <div key={key} className="flex gap-3 justify-between border-b border-gray-100 pb-1.5 dark:border-gray-800">
                <dt className="text-xs uppercase tracking-wider text-gray-400">{key.replace(/_/g, " ")}</dt>
                <dd className="max-w-[60%] break-words text-right font-medium text-gray-900 dark:text-gray-100">
                  {typeof value === "object" ? JSON.stringify(value) : String(value) || "--"}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setStatus(detail.user_id, "verified")}
              className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Approve & mark verified
            </button>
            <button
              onClick={() => setStatus(detail.user_id, "rejected")}
              className="flex-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Reject
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminKycPage() {
  return (
    <AdminShell>
      <KycAdmin />
    </AdminShell>
  );
}
