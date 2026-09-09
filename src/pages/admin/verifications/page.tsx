"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { AdminSection, Pill, TableWrap } from "@/components/admin/ui";

interface UserRow {
  id: string;
  email: string;
  created_at?: string;
  kyc_status?: string;
  email_verified_at?: string | null;
}

function VerificationsAdmin() {
  const { slug } = useAdmin();
  const [unverified, setUnverified] = useState<UserRow[]>([]);
  const [kycReview, setKycReview] = useState<UserRow[]>([]);

  const load = useCallback(async () => {
    const res = await adminFetch<{ unverified_emails: UserRow[]; kyc_review: UserRow[] }>(slug, "/verifications");
    if (res.ok && res.data) {
      setUnverified(res.data.unverified_emails ?? []);
      setKycReview(res.data.kyc_review ?? []);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmEmail = async (id: string) => {
    await adminFetch(slug, `/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ email_verified: true }),
    });
    await load();
  };

  const setKyc = async (id: string, status: string) => {
    await adminFetch(slug, "/kyc", { method: "POST", body: JSON.stringify({ user_id: id, status }) });
    await load();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Verifications</h1>

      <AdminSection title="Unverified emails">
        <TableWrap empty={unverified.length === 0}>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">User</th>
                <th className="px-4 py-2.5 text-left font-medium">Joined</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {unverified.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-[var(--brand)] hover:underline">
                      {u.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "--"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => confirmEmail(u.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      Mark verified
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </AdminSection>

      <AdminSection title="KYC in review / rejected">
        <TableWrap empty={kycReview.length === 0}>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">User</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {kycReview.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-[var(--brand)] hover:underline">
                      {u.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><Pill status={u.kyc_status ?? "in_review"} /></td>
                  <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setKyc(u.id, "verified")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      Verify
                    </button>
                    <button onClick={() => setKyc(u.id, "rejected")} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </AdminSection>
    </div>
  );
}

export default function AdminVerificationsPage() {
  return (
    <AdminShell>
      <VerificationsAdmin />
    </AdminShell>
  );
}
