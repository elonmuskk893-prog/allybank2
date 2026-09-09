"use client";

import Link from "@/lib/next/link";
import { useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";

interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  member_no: string;
  status: string;
  kyc_status: string;
  email_verified_at: string | null;
  two_fa_enabled: boolean;
  created_at: string;
}

function AdminUsers() {
  const { slug } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");

  const load = async (q: string) => {
    const res = await adminFetch<{ users: AdminUser[] }>(slug, `/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    if (res.ok && res.data?.users) setUsers(res.data.users);
  };

  useEffect(() => {
    load("");
  }, [slug]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Users</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") load(query);
        }}
        placeholder="Search by email or name…"
        className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      <div className="overflow-x-auto rounded-2xl border border-gray-200/70 bg-white backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800">
        {users.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No users match.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">#</th>
                <th className="px-4 py-2.5 text-left font-medium">User</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">KYC</th>
                <th className="px-4 py-2.5 text-left font-medium">Email verified</th>
                <th className="px-4 py-2.5 text-left font-medium">2FA</th>
                <th className="px-4 py-2.5 text-left font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-black/[0.02] dark:border-gray-700/60 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                    {user.member_no}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.id}`} className="block">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {user.first_name || user.last_name
                          ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
                          : user.email}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.status}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.kyc_status}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {user.email_verified_at ? "✓" : "--"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {user.two_fa_enabled ? "✓" : "--"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
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

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <AdminUsers />
    </AdminShell>
  );
}