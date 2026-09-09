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
  status: string;
  kyc_status: string;
  created_at: string;
}

interface AdminCounts {
  currency?: string;
  total_deposits: number;
  pending_deposits: number;
  total_transfers: number;
  pending_transfers: number;
  total_users: number;
  active_users: number;
  blocked_users: number;
}

function formatMoney(value: number, symbol: string): string {
  const num = Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  const sign = Number(safe.toFixed(2)) < 0 ? "-" : "";
  return `${sign}${symbol}${Math.abs(safe).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function AdminDashboard() {
  const { slug, siteName } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [counts, setCounts] = useState<AdminCounts | null>(null);

  useEffect(() => {
    (async () => {
      const [usersRes, overviewRes] = await Promise.all([
        adminFetch<{ users: AdminUser[] }>(slug, "/users"),
        adminFetch<{ counts: AdminCounts }>(slug, "/overview"),
      ]);
      if (usersRes.ok && usersRes.data?.users) setUsers(usersRes.data.users);
      if (overviewRes.ok && overviewRes.data?.counts) setCounts(overviewRes.data.counts);
    })();
  }, [slug]);

  const symbol = counts?.currency ?? "$";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const stats = [
    { label: "Total Deposit", value: counts ? formatMoney(counts.total_deposits, symbol) : "…", icon: "fa-download", tone: "text-amber-500", href: "/admin/deposits" },
    { label: "Pending Deposit(s)", value: counts ? formatMoney(counts.pending_deposits, symbol) : "…", icon: "fa-hourglass-half", tone: "text-sky-500", href: "/admin/deposits" },
    { label: "Total Transfers", value: counts ? formatMoney(counts.total_transfers, symbol) : "…", icon: "fa-right-left", tone: "text-rose-500", href: "/admin/withdrawals" },
    { label: "Pending Transfers", value: counts ? formatMoney(counts.pending_transfers, symbol) : "…", icon: "fa-pause-circle", tone: "text-indigo-500", href: "/admin/withdrawals" },
    { label: "Total Users", value: counts ? counts.total_users.toString() : "…", icon: "fa-users", tone: "text-blue-500", href: "/admin/users" },
    { label: "Active Users", value: counts ? counts.active_users.toString() : "…", icon: "fa-user-check", tone: "text-emerald-500", href: "/admin/users" },
    { label: "Blocked Users", value: counts ? counts.blocked_users.toString() : "…", icon: "fa-user-xmark", tone: "text-red-500", href: "/admin/users" },
  ];

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6 text-white shadow-sm sm:p-8"
        style={{
          background:
            "linear-gradient(135deg, var(--brand), color-mix(in srgb, var(--brand) 55%, #000))",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
              <i className="fa-solid fa-gauge-high" /> Dashboard
            </h1>
            <p className="mt-2 text-sm font-medium text-white/90">Welcome back, {siteName}!</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-white/70">
              <i className="fa-regular fa-clock" /> {today}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/deposits"
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25"
            >
              <i className="fa-solid fa-arrow-down" /> Deposits
            </Link>
            <Link
              href="/admin/withdrawals"
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25"
            >
              <i className="fa-solid fa-right-left" /> Transfers
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25"
            >
              <i className="fa-solid fa-users" /> Users
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const card = (
            <div className="flex items-center gap-4 rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700/50 dark:bg-gray-800">
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gray-100 text-xl dark:bg-gray-700/60 ${stat.tone}`}
              >
                <i className={`fa-solid ${stat.icon}`} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-xs font-medium uppercase tracking-wider text-gray-500">
                  {stat.label}
                </div>
                <div className="mt-1 truncate text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {stat.value}
                </div>
              </div>
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>
              {card}
            </Link>
          ) : (
            <div key={stat.label}>{card}</div>
          );
        })}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Recent users
          </h2>
          <Link
            href="/admin/users"
            className="text-xs text-[var(--brand)] hover:text-gray-900 dark:hover:text-white"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800">
          {users.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No users yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Email</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                    <th className="px-4 py-2.5 text-left font-medium">KYC</th>
                    <th className="px-4 py-2.5 text-left font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 10).map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 last:border-0 dark:border-gray-700/60"
                    >
                      <td className="px-4 py-3">
                        <Link
                          className="font-medium text-gray-900 hover:text-[var(--brand)] dark:text-gray-100"
                          href={`/admin/users/${user.id}`}
                        >
                          {user.email}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.status}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.kyc_status}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminShell>
      <AdminDashboard />
    </AdminShell>
  );
}