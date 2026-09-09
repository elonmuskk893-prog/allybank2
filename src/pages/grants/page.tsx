"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { bankFetch } from "@/lib/api";

interface Grant {
  id: string;
  kind: string;
  status: string;
  created_at: string;
  disbursed_amount?: number | string;
  data?: {
    requested_amount?: number | string;
  };
}

interface StatusConfig {
  grad: string;
  border: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  message: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    grad: "from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20",
    border: "border-blue-200/50 dark:border-blue-700/50",
    icon: "fa-clock",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    title: "Application Processing",
    message: "Your grant application is currently being processed.",
  },
  approved: {
    grad: "from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20",
    border: "border-green-200/50 dark:border-green-700/50",
    icon: "fa-check-circle",
    iconBg: "bg-green-100 dark:bg-green-900/50",
    iconColor: "text-green-600 dark:text-green-400",
    title: "Application Approved",
    message: "Your grant application has been approved.",
  },
  rejected: {
    grad: "from-red-50/80 to-rose-50/80 dark:from-red-900/20 dark:to-rose-900/20",
    border: "border-red-200/50 dark:border-red-700/50",
    icon: "fa-times-circle",
    iconBg: "bg-red-100 dark:bg-red-900/50",
    iconColor: "text-red-600 dark:text-red-400",
    title: "Application Not Approved",
    message: "Unfortunately, your grant application was not approved.",
  },
  disbursed: {
    grad: "from-purple-50/80 to-fuchsia-50/80 dark:from-purple-900/20 dark:to-fuchsia-900/20",
    border: "border-purple-200/50 dark:border-purple-700/50",
    icon: "fa-check-double",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    iconColor: "text-purple-600 dark:text-purple-400",
    title: "Grant Disbursed",
    message: "Your grant has been successfully disbursed.",
  },
};

export default function GrantsPage() {
  return (
    <AppShell>
      <GrantsContent />
    </AppShell>
  );
}

function GrantsContent() {
  const { site } = useMe();
  const currency = site.primary_currency;

  const [grants, setGrants] = useState<Grant[]>([]);

  useEffect(() => {
    (async () => {
      const result = await bankFetch<{ grants: Grant[] }>("/grants");
      if (result.ok && result.data?.grants) {
        setGrants(result.data.grants);
      }
    })();
  }, []);

  const first = grants[0];
  const status = first ? STATUS_CONFIG[first.status] : null;

  return (
    <div className="-mx-4 -my-5 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 lg:-mx-6 lg:p-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 hidden items-center justify-between lg:flex">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Grant Applications
          </h1>
        </div>

        {status && (
          <div
            className={`mb-6 overflow-hidden rounded-xl border bg-gradient-to-r ${status.grad} ${status.border} shadow-sm backdrop-blur-xl`}
          >
            <div className="flex flex-col items-center justify-between p-4 md:flex-row lg:p-5">
              <div className="mb-3 flex items-center md:mb-0">
                <div
                  className={`mr-3 grid h-10 w-10 shrink-0 place-items-center rounded-full ${status.iconBg}`}
                >
                  <i className={`fas ${status.icon} ${status.iconColor} text-sm`} />
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
                    {status.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {status.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 overflow-hidden rounded-xl border border-white/20 bg-white/95 shadow-sm backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95">
          <div className="p-4 text-center lg:p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Select Application Type
            </h2>
            <p className="mx-auto mb-6 max-w-3xl text-sm text-gray-600 dark:text-gray-300">
              Please select the type of application you would like to submit.
              Different documentation is required for individual and company
              applications.
            </p>
            <div className="mx-auto grid max-w-4xl gap-4 grid-cols-1 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition hover:shadow-md dark:border-gray-600/50 dark:bg-gray-700/80">
                <div
                  className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full"
                  style={{
                    background: "color-mix(in srgb, var(--brand) 14%, transparent)",
                  }}
                >
                  <i className="fas fa-user text-sm" style={{ color: "var(--brand)" }} />
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  Apply as Individual
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  For individual applicants seeking funding for programs,
                  equipment, research or community outreach.
                </p>
                <Link
                  href="/grants/apply#individual"
                  className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                  style={{ background: "var(--brand)" }}
                >
                  Continue
                </Link>
              </div>
              <div className="rounded-xl border border-gray-200/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition hover:shadow-md dark:border-gray-600/50 dark:bg-gray-700/80">
                <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-slate-200 dark:bg-slate-600">
                  <i className="fas fa-building text-sm text-slate-600 dark:text-slate-300" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  Apply as Company
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  For registered organizations with an EIN, established history
                  and defined mission.
                </p>
                <Link
                  href="/grants/apply#company"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700"
                >
                  Continue
                </Link>
              </div>
            </div>
          </div>
        </div>

        {grants.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/20 bg-white/95 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95">
            <div className="border-b border-gray-200/50 px-4 py-3 dark:border-gray-700/50">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                My Applications
              </h2>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {grants.map((grant) => {
                const requestedAmount = grant.data?.requested_amount ?? null;
                return (
                  <li
                    key={grant.id}
                    className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <div className="font-medium capitalize text-gray-900 dark:text-gray-100">
                        {grant.kind} grant
                        {requestedAmount != null
                          ? ` \u00b7 ${Number(requestedAmount).toLocaleString()} ${currency}`
                          : ""}
                      </div>
                      <div className="text-xs text-gray-500">
                        Submitted{" "}
                        {new Date(grant.created_at).toLocaleDateString()}
                      </div>
                      {Number(grant.disbursed_amount) > 0 && (
                        <div className="text-xs text-green-700 dark:text-green-300">
                          Disbursed: {Number(grant.disbursed_amount).toLocaleString()}{" "}
                          {currency}
                        </div>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        grant.status === "disbursed"
                          ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                          : grant.status === "approved"
                            ? "bg-green-500/15 text-green-700 dark:text-green-300"
                            : grant.status === "rejected"
                              ? "bg-red-500/15 text-red-700 dark:text-red-300"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-300"
                      }`}
                    >
                      {grant.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
