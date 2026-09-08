"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { bankFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface Loan {
  id: string;
  amount: number | string;
  currency: string;
  purpose?: string | null;
  term_months: number;
  interest_pct: number | string;
  status: string;
  applied_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  repaid: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  defaulted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function LoansPage() {
  return (
    <AppShell>
      <LoansContent />
    </AppShell>
  );
}

function LoansContent() {
  const { site } = useMe();
  const router = useRouter();
  const currency = site.primary_currency;

  const [loans, setLoans] = useState<Loan[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const result = await bankFetch<{ loans: Loan[] }>("/loans");
      if (result.ok && result.data?.loans) {
        setLoans(result.data.loans);
      }
    })();
  }, []);

  const filtered = useMemo(
    () =>
      loans.filter(
        (loan) =>
          !query.trim() ||
          `${loan.purpose ?? ""} ${loan.amount}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [loans, query],
  );

  const termLabel = (months: number) => {
    if (months === 1) return "1 Month";
    if (months <= 12) return `${months} Months`;
    return `${Math.round(months / 12)} Year${months >= 24 ? "s" : ""}`;
  };

  return (
    <div className="-mx-4 -my-5 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 lg:-mx-6 lg:p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 hidden items-center justify-between lg:flex">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Loan History
          </h1>
          <Link
            href="/loans/apply"
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-white shadow transition hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            <i className="fas fa-plus mr-2 text-xs" />
            Apply for Loan
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/20 bg-white/95 shadow-sm backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95">
          <div className="border-b border-gray-200/50 p-3 dark:border-gray-700/50">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
                <i className="fas fa-search text-xs text-gray-400" />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by loan purpose or amount..."
                className="block w-full rounded-lg border border-gray-200 bg-white/90 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-700/90 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/80 dark:bg-gray-700/80">
                <tr>
                  {["Type", "Amount", "Purpose", "Duration", "Status", "Date Applied"].map(
                    (header, index) => (
                      <th
                        key={header}
                        className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${index === 2 ? "hidden md:table-cell" : ""} ${index === 3 ? "hidden sm:table-cell" : ""} ${index === 5 ? "hidden lg:table-cell" : ""}`}
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-gray-600/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div
                          className="mb-3 grid h-12 w-12 place-items-center rounded-full"
                          style={{
                            background:
                              "color-mix(in srgb, var(--brand) 12%, transparent)",
                          }}
                        >
                          <i
                            className="fas fa-landmark text-lg"
                            style={{ color: "var(--brand)" }}
                          />
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          No loan applications
                        </p>
                        <Link
                          href="/loans/apply"
                          className="mt-3 inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow transition hover:opacity-90"
                          style={{ background: "var(--brand)" }}
                        >
                          <i className="fas fa-plus mr-2 text-xs" />
                          Apply for a loan
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((loan) => (
                    <tr
                      key={loan.id}
                      className="cursor-pointer transition hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                      onClick={() => router.push(`/loans/${loan.id}`)}
                    >
                      <td className="whitespace-nowrap px-3 py-2">
                        <div
                          className="grid h-7 w-7 place-items-center rounded-full"
                          style={{
                            background:
                              "color-mix(in srgb, var(--brand) 14%, transparent)",
                          }}
                        >
                          <i
                            className="fas fa-university text-xs"
                            style={{ color: "var(--brand)" }}
                          />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(currency, Number(loan.amount))}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {loan.currency}
                        </div>
                      </td>
                      <td className="hidden px-3 py-2 md:table-cell">
                        <div className="max-w-[160px] truncate text-sm text-gray-900 dark:text-white">
                          {loan.purpose || "--"}
                        </div>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2 sm:table-cell">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {termLabel(Number(loan.term_months))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {loan.interest_pct}% interest
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[loan.status]}`}
                        >
                          {loan.status}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2 text-sm text-gray-600 dark:text-gray-400 lg:table-cell">
                        {new Date(loan.applied_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
