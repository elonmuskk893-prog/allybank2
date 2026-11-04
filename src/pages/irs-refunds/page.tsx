"use client";

import { useEffect, useState } from "react";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { bankFetch } from "@/lib/api";

interface Refund {
  id: string;
  tax_year: number;
  amount: string | number;
  status: string;
  notes: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-500/15 text-green-700 dark:text-green-300",
  approved: "bg-green-500/15 text-green-700 dark:text-green-300",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
  processing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  pending: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
};

export default function IrsRefundsPage() {
  return (
    <AppShell>
      <IrsRefundsContent />
    </AppShell>
  );
}

function IrsRefundsContent() {
  const { site } = useMe();
  const currency = site.primary_currency;
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await bankFetch<{ refunds: Refund[] }>("/irs-refunds");
      if (res.ok && res.data?.refunds) setRefunds(res.data.refunds);
      setLoading(false);
    })();
  }, []);

  const total = refunds.reduce((sum, refund) => sum + Number(refund.amount ?? 0), 0);

  return (
    <div className="-mx-4 -my-5 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 lg:-mx-6 lg:p-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Tax Documents</h1>

        <div className="mb-4 rounded-xl border border-white/20 bg-white/95 p-4 shadow-sm backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95 lg:p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">Documents on file</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {total.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Uploaded tax documents and their status are shown here.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/20 bg-white/95 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95">
          <div className="border-b border-gray-200/50 px-4 py-3 dark:border-gray-700/50">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">My documents</h2>
          </div>
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">Loading…</p>
          ) : refunds.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <i className="fa-solid fa-file-import mb-2 text-2xl text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                No tax documents have been uploaded yet.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Contact support with questions about your documents.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {refunds.map((refund) => (
                <li
                  key={refund.id}
                  className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      Tax year {refund.tax_year} ·{" "}
                      {Number(refund.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}{" "}
                      {currency}
                    </div>
                    <div className="text-xs text-gray-500">
                      Uploaded {new Date(refund.created_at).toLocaleDateString()}
                    </div>
                    {refund.notes && (
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        {refund.notes}
                      </div>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      STATUS_STYLES[refund.status] ?? STATUS_STYLES.pending
                    }`}
                  >
                    {refund.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
