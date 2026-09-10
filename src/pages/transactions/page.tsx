"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { bankFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Loader } from "@/components/ui/loader";

const INPUT_CLS =
  "block w-full rounded-xl border border-gray-200/50 bg-white/80 p-2.5 text-gray-900 backdrop-blur-sm transition focus:border-transparent focus:ring-2 dark:border-gray-600/50 dark:bg-gray-700/80 dark:text-white";

const DEBIT_KINDS = [
  "admin-debit",
  "withdrawal",
  "transfer",
  "transfer-out",
  "plan-debit",
  "card-spend",
  "fee",
  "loan-repay",
];


const KIND_LABELS: Record<string, string> = {
  "admin-credit": "Credited",
  "admin-debit": "Debited",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  "transfer-in": "Transfer received",
  "transfer-out": "Transfer sent",
  "plan-debit": "Plan purchase",
  "plan-roi": "Plan ROI",
  "card-spend": "Card spend",
  "card-topup": "Card top-up",
  fee: "Fee",
  "loan-disburse": "Loan disbursed",
  "loan-repay": "Loan repayment",
  "crypto-swap": "Crypto swap",
};

function isCredit(tx: { kind: string; direction?: string | null }): boolean {
  if (tx.direction === "credit") return true;
  if (tx.direction === "debit") return false;
  return !DEBIT_KINDS.includes(tx.kind);
}

function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

interface Tx {
  id: number | string;
  kind: string;
  direction?: string | null;
  amount: number | string;
  status?: string | null;
  created_at: string;
  balance_after?: number | string | null;
  meta?: { label?: string };
}

interface TransactionsResponse {
  transactions?: Tx[];
  total?: number;
}

interface EmailResponse {
  ok?: boolean;
  email?: string;
}

export default function TransactionsPage() {
  return (
    <AppShell>
      <TransactionsFlow />
    </AppShell>
  );
}

function TransactionsFlow() {
  const { site, user } = useMe();
  const cur = site.primary_currency;
  const siteName = site.name;
  const userEmail = user.email;

  const [transactions, setTransactions] = useState<Tx[] | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [perPage, setPerPage] = useState(15);
  const [page, setPage] = useState(1);
  const [batch, setBatch] = useState(1);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    (async () => {
      const result = await bankFetch<TransactionsResponse>(
        `/transactions?limit=200&offset=${(batch - 1) * 200}`,
      );
      if (!alive) return;
      const items =
        result.ok && result.data?.transactions ? result.data.transactions : [];
      if (result.ok) {
        const serverTotal =
          result.data?.total ?? (batch - 1) * 200 + items.length;
        setTotal(serverTotal);
        if (items.length === 0 && batch > 1)
          return setBatch(Math.min(batch - 1, Math.max(1, Math.ceil(serverTotal / 200))));
      }
      setTransactions(items);
      setBusy(false);
    })();
    return () => {
      alive = false;
    };
  }, [batch]);

  const filtered = useMemo(() => {
    if (!transactions) return [];
    const items = transactions.filter((tx) => {
      if (
        ("Credit" === typeFilter && !isCredit(tx)) ||
        ("Debit" === typeFilter && isCredit(tx))
      )
        return false;
      const date = new Date(tx.created_at);
      return !(
        (dateFrom && date < new Date(dateFrom)) ||
        (dateTo && date > new Date(dateTo + "T23:59:59"))
      );
    });
    return items.sort((a, b) =>
      "asc" === sortDir
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [transactions, typeFilter, dateFrom, dateTo, sortDir]);

  const totalFiltered = filtered.length;
  const pages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const currentPage = Math.min(page, pages);
  const sliceStart = (currentPage - 1) * perPage;
  const visible = filtered.slice(sliceStart, sliceStart + perPage);
  const firstItem = totalFiltered === 0 ? 0 : sliceStart + 1;
  const lastItem = Math.min(sliceStart + perPage, totalFiltered);
  const batches = Math.max(1, Math.ceil(total / 200));

  const goBatch = (b: number) => {
    setBatch(b);
    setPage(1);
  };

  if (transactions === null) return <Loader />;

  const amountLabel = (tx: Tx) =>
    `${isCredit(tx) ? "+" : "-"} ${formatCurrency(cur, Math.abs(Number(tx.amount)))}`;

  return (
    <div className="-mx-4 -my-5 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 lg:-mx-6 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 hidden items-center justify-between lg:flex">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h1>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="inline-flex items-center rounded-xl border border-gray-200/50 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-xl transition hover:bg-gray-50 dark:border-gray-700/50 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-700/50"
            >
              <i className="fa-solid fa-filter mr-2 text-sm" /> Filter
            </button>
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:scale-105"
              style={{ background: "var(--brand)" }}
            >
              <i className="fa-solid fa-download mr-2 text-sm" /> Export
            </button>
          </div>
        </div>

        <div className="mb-6 flex space-x-3 lg:hidden">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200/50 bg-white/80 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-xl transition hover:bg-gray-50 dark:border-gray-700/50 dark:bg-gray-800/80 dark:text-gray-300"
          >
            <i className="fa-solid fa-filter mr-2 text-sm" /> Filter
          </button>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg"
            style={{ background: "var(--brand)" }}
          >
            <i className="fa-solid fa-download mr-2 text-sm" /> Export
          </button>
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-lg backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/80 lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
              <thead
                style={{
                  background: "color-mix(in srgb, var(--brand) 8%, transparent)",
                }}
              >
                <tr>
                  {[
                    "",
                    "Amount",
                    "Type",
                    "Status",
                    "Reference",
                    "Description",
                    "Date",
                    "",
                  ].map((header, idx) => (
                    <th
                      key={`${header}-${idx}`}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--brand)" }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/30 bg-white/50 dark:divide-gray-700/30 dark:bg-gray-800/50">
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  visible.map((tx) => {
                    const credit = isCredit(tx);
                    return (
                      <tr
                        key={tx.id}
                        className="transition hover:bg-gray-50/60 dark:hover:bg-gray-700/30"
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          <div
                            className={`grid h-8 w-8 place-items-center rounded-xl ${credit ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
                          >
                            <i
                              className={`fa-solid ${credit ? "fa-plus text-green-600 dark:text-green-400" : "fa-minus text-red-600 dark:text-red-400"} text-xs`}
                            />
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className={`text-sm font-semibold ${credit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {amountLabel(tx)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {cur}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <CreditBadge credit={credit} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <TxStatusBadge status={tx.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
                            #{tx.id}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="max-w-xs truncate text-sm text-gray-700 dark:text-gray-300">
                            {tx.meta?.label ?? kindLabel(tx.kind)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(tx.created_at).toLocaleDateString(
                              undefined,
                              { month: "short", day: "2-digit", year: "numeric" },
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(tx.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="inline-flex items-center rounded-lg border border-gray-200/60 bg-white/80 px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-gray-600/50 dark:bg-gray-700/80 dark:text-gray-300 dark:hover:bg-gray-600/50"
                          >
                            <i
                              className="fa-solid fa-receipt mr-1.5 text-xs"
                              style={{ color: "var(--brand)" }}
                            />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalFiltered > 0 && (
            <PaginationFooter
              firstItem={firstItem}
              lastItem={lastItem}
              total={totalFiltered}
              page={currentPage}
              pages={pages}
              onPage={setPage}
            />
          )}
          {batches > 1 && (
            <div className="border-t border-gray-200/50 px-4 py-4 dark:border-gray-700/50">
              <BatchNav batch={batch} batches={batches} onBatch={goBatch} busy={busy} />
            </div>
          )}
        </div>

        <div className="space-y-3 lg:hidden">
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-white/20 bg-white/80 py-12 shadow-lg backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <EmptyState />
            </div>
          ) : (
            visible.map((tx) => {
              const credit = isCredit(tx);
              return (
                <div
                  key={tx.id}
                  className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/80"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-10 w-10 place-items-center rounded-xl ${credit ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
                      >
                        <i
                          className={`fa-solid ${credit ? "fa-plus text-green-600 dark:text-green-400" : "fa-minus text-red-600 dark:text-red-400"} text-sm`}
                        />
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${credit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {amountLabel(tx)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {cur}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TxStatusBadge status={tx.status} />
                      <CreditBadge credit={credit} />
                      <button
                        type="button"
                        onClick={() => setSelectedTx(tx)}
                        aria-label="View receipt"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200/60 bg-white/80 shadow-sm transition hover:bg-gray-50 dark:border-gray-600/50 dark:bg-gray-700/80 dark:hover:bg-gray-600/50"
                      >
                        <i
                          className="fa-solid fa-receipt text-xs"
                          style={{ color: "var(--brand)" }}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <InfoRow k="Status">
                      <span className="inline-flex items-center rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />
                        Completed
                      </span>
                    </InfoRow>
                    <InfoRow k="Reference">
                      <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                        #{tx.id}
                      </span>
                    </InfoRow>
                    <InfoRow k="Description">
                      <span className="max-w-32 truncate text-right text-xs text-gray-700 dark:text-gray-300">
                        {tx.meta?.label ?? kindLabel(tx.kind)}
                      </span>
                    </InfoRow>
                    <InfoRow k="Date">
                      <div className="text-right">
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          {new Date(tx.created_at).toLocaleDateString(
                            undefined,
                            { month: "short", day: "2-digit", year: "numeric" },
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </InfoRow>
                  </div>
                </div>
              );
            })
          )}
          {totalFiltered > 0 && (
            <div className="rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <div className="mb-3 text-center text-sm text-gray-600 dark:text-gray-400">
                Showing <b style={{ color: "var(--brand)" }}>{firstItem}</b> to{" "}
                <b style={{ color: "var(--brand)" }}>{lastItem}</b> of{" "}
                <b style={{ color: "var(--brand)" }}>{totalFiltered}</b> results
              </div>
              <PageNav page={currentPage} pages={pages} onPage={setPage} />
            </div>
          )}
          {batches > 1 && (
            <div className="rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <BatchNav batch={batch} batches={batches} onBatch={goBatch} busy={busy} />
            </div>
          )}
        </div>
      </div>

      {filterOpen && (
        <Modal
          onClose={() => setFilterOpen(false)}
          icon="fa-filter"
          title="Filter Transactions"
          subtitle="Customize your transaction view"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={INPUT_CLS}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={INPUT_CLS}
              >
                <option value="">All</option>
                <option value="Credit">Credit</option>
                <option value="Debit">Debit</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Sort by
              </label>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
                className={INPUT_CLS}
              >
                <option value="asc">Oldest first (ASC)</option>
                <option value="desc">Newest first (DESC)</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Per page
              </label>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className={INPUT_CLS}
              >
                {[15, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="rounded-xl border border-gray-200/50 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:border-gray-600/50 dark:bg-gray-700/80 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setFilterOpen(false);
              }}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:scale-105"
              style={{ background: "var(--brand)" }}
            >
              Apply Filters
            </button>
          </div>
        </Modal>
      )}

      {exportOpen && (
        <ExportModal
          onClose={() => setExportOpen(false)}
          filtered={filtered}
          siteName={siteName}
          userEmail={userEmail}
          cur={cur}
        />
      )}

      {selectedTx && (
        <ReceiptModal
          tx={selectedTx}
          cur={cur}
          siteName={siteName}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}

function ReceiptModal({
  tx,
  cur,
  siteName,
  onClose,
}: {
  tx: Tx;
  cur: string;
  siteName: string;
  onClose: () => void;
}) {
  const credit = isCredit(tx);
  const amount = formatCurrency(cur, Math.abs(Number(tx.amount)));
  const balanceAfter =
    tx.balance_after != null
      ? formatCurrency(cur, Number(tx.balance_after))
      : "--";
  const date = new Date(tx.created_at).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = new Date(tx.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const desc = tx.meta?.label ?? kindLabel(tx.kind);

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #tx-receipt-print { display: block !important; position: fixed; inset: 0; z-index: 9999; background: #fff; padding: 40px; }
          #tx-receipt-print * { color: #000 !important; background: transparent !important; border-color: #ccc !important; box-shadow: none !important; }
        }
      `}</style>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <div
            id="tx-receipt-print"
            className="relative mx-auto w-full max-w-sm rounded-2xl border border-white/20 bg-white shadow-2xl dark:border-gray-700/50 dark:bg-gray-800"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-500 print:hidden"
            >
              <i className="fa-solid fa-times" />
            </button>
            <div
              className="rounded-t-2xl px-6 pt-8 pb-6 text-center"
              style={{
                background: "color-mix(in srgb, var(--brand) 8%, transparent)",
              }}
            >
              <div
                className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl"
                style={{
                  background: "color-mix(in srgb, var(--brand) 14%, transparent)",
                }}
              >
                <i
                  className="fa-solid fa-receipt text-2xl"
                  style={{ color: "var(--brand)" }}
                />
              </div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 print:text-gray-600">
                {siteName}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 print:text-gray-500">
                Transaction Receipt
              </p>
            </div>
            <div className="border-b border-gray-100 px-6 py-5 text-center dark:border-gray-700/50">
              <div
                className={`inline-flex items-center gap-2 text-3xl font-bold ${credit ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
              >
                <span>{credit ? "+" : "−"}</span>
                <span>{amount}</span>
              </div>
              <div className="mt-1">
                <CreditBadge credit={credit} />
              </div>
            </div>
            <div className="divide-y divide-gray-100 px-6 dark:divide-gray-700/50">
              <Row label="Status">
                <TxStatusBadge status={tx.status} />
              </Row>
              <Row label="Reference">
                <span className="font-mono text-sm text-gray-800 dark:text-gray-100">
                  #{tx.id}
                </span>
              </Row>
              <Row label="Type">
                <span className="text-sm text-gray-800 dark:text-gray-100">
                  {kindLabel(tx.kind)}
                </span>
              </Row>
              {tx.meta?.label && (
                <Row label="Description">
                  <span className="max-w-40 text-right text-sm text-gray-800 dark:text-gray-100">
                    {desc}
                  </span>
                </Row>
              )}
              <Row label="Date">
                <span className="text-right text-sm text-gray-800 dark:text-gray-100">
                  {date}
                </span>
              </Row>
              <Row label="Time">
                <span className="text-sm text-gray-800 dark:text-gray-100">
                  {time}
                </span>
              </Row>
              <Row label="Balance after">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {balanceAfter}
                </span>
              </Row>
            </div>
            <div className="px-6 py-5 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white shadow-lg transition hover:scale-105"
                style={{ background: "var(--brand)" }}
              >
                <i className="fa-solid fa-print text-sm" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      {children}
    </div>
  );
}

function ExportModal({
  onClose,
  filtered,
  siteName,
  userEmail,
  cur,
}: {
  onClose: () => void;
  filtered: Tx[];
  siteName: string;
  userEmail: string;
  cur: string;
}) {
  const [mode, setMode] = useState("csv");
  const [state, setState] = useState("idle");
  const [err, setErr] = useState("");
  const [sentEmail, setSentEmail] = useState("");

  const sendEmail = async () => {
    setState("sending");
    setErr("");
    const result = await bankFetch<EmailResponse>("/transactions/email", {
      method: "POST",
    });
    if (result.ok && result.data?.ok) {
      setSentEmail(result.data.email ?? userEmail);
      setState("sent");
    } else {
      setErr(result.error ?? "Something went wrong. Please try again.");
      setState("error");
    }
  };

  const printStatement = () => {
    const generated = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const rows = filtered
      .map((tx) => {
        const credit = isCredit(tx);
        const amount = formatCurrency(cur, Math.abs(Number(tx.amount)));
        const balanceAfter =
          tx.balance_after != null
            ? formatCurrency(cur, Number(tx.balance_after))
            : "--";
        const date = new Date(tx.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
        const time = new Date(tx.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const label = tx.meta?.label ?? kindLabel(tx.kind);
        return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;">${date} ${time}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;">${label}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:600;color:${credit ? "#16a34a" : "#dc2626"};">${credit ? "+" : "−"}${amount}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;">${balanceAfter}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;font-family:monospace;">#${tx.id}</td>
      </tr>`;
      })
      .join("");
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${siteName} -- Transaction Statement</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111827; padding: 40px; }
    @media print { body { padding: 20px; } }
    .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 24px; }
    .site-name { font-size: 22px; font-weight: 800; color: #111827; }
    .meta { font-size: 12px; color: #6b7280; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { padding: 10px; background: #f9fafb; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
    .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="site-name">${siteName}</div>
    <div class="meta">Transaction Statement &nbsp;\xb7&nbsp; Generated ${generated} &nbsp;\xb7&nbsp; ${filtered.length} transaction${filtered.length !== 1 ? "s" : ""}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date &amp; Time</th>
        <th>Description</th>
        <th>Amount</th>
        <th>Balance After</th>
        <th>Reference</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="5" style="padding:24px;text-align:center;color:#9ca3af;font-size:13px;">No transactions in selected range</td></tr>'}
    </tbody>
  </table>
  <div class="footer">${siteName} &nbsp;\xb7&nbsp; Secure Banking Platform &nbsp;\xb7&nbsp; Confidential</div>
</body>
</html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      icon="fa-download"
      title="Export Transactions"
      subtitle="Download or share your transaction data"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
            Export option
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "csv", icon: "fa-file-csv", label: "CSV File" },
              { id: "pdf", icon: "fa-print", label: "PDF / Print" },
              { id: "email", icon: "fa-envelope", label: "Email me" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setMode(opt.id);
                  setState("idle");
                  setErr("");
                }}
                className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-medium transition ${mode === opt.id ? "border-transparent text-white shadow-md" : "border-gray-200/60 bg-white/80 text-gray-600 hover:bg-gray-50 dark:border-gray-600/50 dark:bg-gray-700/80 dark:text-gray-300 dark:hover:bg-gray-600/50"}`}
                style={mode === opt.id ? { background: "var(--brand)" } : undefined}
              >
                <i className={`fa-solid ${opt.icon} text-base`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {mode === "csv" && (
          <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-500 dark:border-gray-700/50 dark:bg-gray-700/50 dark:text-gray-400">
            Downloads all your transactions as a spreadsheet-ready CSV file.
          </p>
        )}
        {mode === "pdf" && (
          <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-500 dark:border-gray-700/50 dark:bg-gray-700/50 dark:text-gray-400">
            Opens a print-ready statement ({filtered.length} transaction
            {filtered.length !== 1 ? "s" : ""}). Choose “Save as PDF” in the
            print dialog.
          </p>
        )}
        {mode === "email" && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-700/50 dark:bg-gray-700/50">
            {state === "sent" ? (
              <p className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                <i className="fa-solid fa-circle-check" />
                Statement sent to <strong>{sentEmail}</strong>
              </p>
            ) : state === "error" ? (
              <p className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                <i className="fa-solid fa-circle-exclamation mt-0.5" />
                {err}
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                A statement will be sent to{" "}
                <strong className="text-gray-700 dark:text-gray-200">
                  {userEmail}
                </strong>
                .
              </p>
            )}
          </div>
        )}
      </div>
      <div className="mt-6 space-y-2">
        {mode === "csv" && (
          /* eslint-disable-next-line @next/next/no-html-link-for-pages -- download endpoint, not an app route */
          <a
            href="/api/banking-public/transactions/export"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:scale-105"
            style={{ background: "var(--brand)" }}
            onClick={onClose}
          >
            <i className="fa-solid fa-download text-sm" />
            Download CSV
          </a>
        )}
        {mode === "pdf" && (
          <button
            type="button"
            onClick={printStatement}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:scale-105"
            style={{ background: "var(--brand)" }}
          >
            <i className="fa-solid fa-print text-sm" />
            Print Statement
          </button>
        )}
        {mode === "email" && state !== "sent" && (
          <button
            type="button"
            onClick={sendEmail}
            disabled={state === "sending"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:scale-105 disabled:opacity-60"
            style={{ background: "var(--brand)" }}
          >
            {state === "sending" ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin text-sm" />
                Sending…
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane text-sm" />
                Send to my inbox
              </>
            )}
          </button>
        )}
        {mode === "email" && state === "sent" && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200/50 bg-white/80 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm dark:border-gray-600/50 dark:bg-gray-700/80 dark:text-gray-300"
          >
            Close
          </button>
        )}
      </div>
    </Modal>
  );
}

function CreditBadge({ credit }: { credit: boolean }) {
  return credit ? (
    <span className="inline-flex items-center rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />
      Credit
    </span>
  ) : (
    <span className="inline-flex items-center rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
      Debit
    </span>
  );
}

const TX_STATUS_STYLES: Record<string, { cls: string; dot: string; label: string }> = {
  completed: {
    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    dot: "bg-green-500",
    label: "Completed",
  },
  pending: {
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    dot: "bg-amber-500",
    label: "Pending",
  },
  cancelled: {
    cls: "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300",
    dot: "bg-gray-400",
    label: "Cancelled",
  },
  failed: {
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    dot: "bg-red-500",
    label: "Failed",
  },
};

/** Shows the transaction's real state — never assume "completed". */
function TxStatusBadge({ status }: { status?: string | null }) {
  const s = TX_STATUS_STYLES[String(status ?? "completed")] ?? TX_STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ${s.cls}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function InfoRow({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500 dark:text-gray-400">{k}</span>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="mb-4 grid h-16 w-16 place-items-center rounded-2xl"
        style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}
      >
        <i className="fa-solid fa-receipt text-2xl" style={{ color: "var(--brand)" }} />
      </div>
      <p className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
        No transactions found
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Try adjusting your search or filter parameters
      </p>
    </div>
  );
}

function PaginationFooter({
  firstItem,
  lastItem,
  total,
  page,
  pages,
  onPage,
}: {
  firstItem: number;
  lastItem: number;
  total: number;
  page: number;
  pages: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="border-t border-gray-200/50 px-4 py-4 dark:border-gray-700/50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 sm:mb-0">
          Showing <b style={{ color: "var(--brand)" }}>{firstItem}</b> to{" "}
          <b style={{ color: "var(--brand)" }}>{lastItem}</b> of{" "}
          <b style={{ color: "var(--brand)" }}>{total}</b> results
        </div>
        <PageNav page={page} pages={pages} onPage={onPage} />
      </div>
    </div>
  );
}

function PageNav({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 sm:justify-end">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        Prev
      </button>
      <span className="px-3 text-sm text-gray-600 dark:text-gray-400">
        {page} / {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        Next
      </button>
    </div>
  );
}

function BatchNav({
  batch,
  batches,
  onBatch,
  busy,
}: {
  batch: number;
  batches: number;
  onBatch: (b: number) => void;
  busy: boolean;
}) {
  if (batches <= 1) return null;
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <div className="text-xs text-gray-500 dark:text-gray-400">
        History loads 200 at a time. Filters and sorting apply to the loaded
        page.
      </div>
      <div className="flex items-center justify-center gap-1 sm:justify-end">
        <button
          type="button"
          disabled={busy || batch <= 1}
          onClick={() => onBatch(batch - 1)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          Newer
        </button>
        <span className="flex items-center gap-1.5 px-3 text-sm text-gray-600 dark:text-gray-400">
          {busy && <i className="fa-solid fa-circle-notch fa-spin text-xs" />}
          Page {batch} of {batches}
        </span>
        <button
          type="button"
          disabled={busy || batch >= batches}
          onClick={() => onBatch(batch + 1)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          Older
        </button>
      </div>
    </div>
  );
}

function Modal({
  icon,
  title,
  subtitle,
  children,
  onClose,
}: {
  icon: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-white/95 px-4 pt-5 pb-4 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-500"
          >
            <i className="fa-solid fa-times" />
          </button>
          <div className="mb-5 text-center">
            <div
              className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl"
              style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}
            >
              <i
                className={`fa-solid ${icon} text-2xl`}
                style={{ color: "var(--brand)" }}
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}