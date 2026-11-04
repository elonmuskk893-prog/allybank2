"use client";

import { useEffect, useMemo, useState } from "react";
import { bankFetch } from "@/lib/api";
import {
  cryptoIcon,
  formatCurrency,
  formatDateTime,
  greeting,
  isCreditTx,
  signedAmount,
} from "@/lib/format";
import type {
  Balance,
  Beneficiary,
  Card,
  CryptoAsset,
  Deposit,
  Transaction,
  Withdrawal,
} from "@/lib/types";
import { Loader } from "@/components/ui/loader";
import { useMe } from "@/components/dashboard/app-shell";
import { useTheme } from "@/components/theme-provider";
import Link from "@/lib/next/link";

/* ------------------------------------------------------------------ */
/* Transaction helpers                                                 */
/* ------------------------------------------------------------------ */

const TX_LABELS: Record<string, string> = {
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

const DEBIT_KINDS = new Set([
  "admin-debit",
  "withdrawal",
  "transfer-out",
  "plan-debit",
  "card-spend",
  "fee",
  "loan-repay",
]);

function toTransactions(transactions: Transaction[], currency: string) {
  return transactions.map((tx) => {
    const credit = isCreditTx(tx as { kind?: string; direction?: string | null });
    return {
      id: String(tx.id),
      credit,
      name: tx.meta?.label ?? TX_LABELS[tx.kind] ?? tx.kind,
      date: formatDateTime(tx.created_at),
      amount: signedAmount(currency, tx.amount, credit),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Dashboard page                                                      */
/* ------------------------------------------------------------------ */

export function DashboardPage() {
  const { site, user } = useMe();
  const currency = site.primary_currency;

  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [showBalances, setShowBalances] = useState(true);

  useEffect(() => {
    (async () => {
      const [
        balanceRes,
        txRes,
        cardsRes,
        beneficiariesRes,
        depositsRes,
        withdrawalsRes,
        assetsRes,
      ] = await Promise.all([
        bankFetch<{ balances: Balance[] }>("/balance"),
        bankFetch<{ transactions: Transaction[] }>("/transactions?limit=50"),
        bankFetch<{ cards: Card[] }>("/cards"),
        bankFetch<{ beneficiaries: Beneficiary[] }>("/beneficiaries"),
        bankFetch<{ deposits: Deposit[] }>("/deposits"),
        bankFetch<{ withdrawals: Withdrawal[] }>("/withdrawals"),
        bankFetch<{ assets: CryptoAsset[] }>("/crypto/assets"),
      ]);

      if (balanceRes.ok && balanceRes.data?.balances) {
        setBalances(balanceRes.data.balances);
      }
      if (txRes.ok && txRes.data?.transactions) {
        setTransactions(txRes.data.transactions);
      }
      if (cardsRes.ok && cardsRes.data?.cards) {
        setCards(cardsRes.data.cards);
      }
      if (beneficiariesRes.ok && beneficiariesRes.data?.beneficiaries) {
        setBeneficiaries(beneficiariesRes.data.beneficiaries);
      }
      if (depositsRes.ok && depositsRes.data?.deposits) {
        setDeposits(depositsRes.data.deposits);
      }
      if (withdrawalsRes.ok && withdrawalsRes.data?.withdrawals) {
        setWithdrawals(withdrawalsRes.data.withdrawals);
      }
      if (assetsRes.ok && assetsRes.data?.assets) {
        setAssets(assetsRes.data.assets);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const pendingDeposits = deposits
      .filter((d) => d.status === "pending")
      .reduce((sum, d) => sum + Number(d.amount), 0);
    const pendingWithdrawals = withdrawals
      .filter((w) => !["sent", "rejected"].includes(w.status))
      .reduce((sum, w) => sum + Number(w.amount), 0);
    const volume = transactions.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
    return {
      pending: pendingDeposits + pendingWithdrawals,
      volume,
    };
  }, [deposits, withdrawals, transactions]);

  if (balances === null) return <Loader />;

  const primary = balances.find((balance) => balance.currency === currency) ??
    balances[0] ?? { currency, amount: "0" };

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;

  const accountLast4 = (user.account_number ?? String(user.id).padStart(10, "0")).slice(-4);
  const isActive = user.status === "active";
  const isVerified = user.kyc_status === "verified";

  const formattedTransactions = toTransactions(transactions, currency).slice(0, 5);
  const activeCards = cards.filter((card) => card.status === "active");
  const topBeneficiaries = [...beneficiaries]
    .sort((a, b) => Number(b.favorite) - Number(a.favorite))
    .slice(0, 8);

  const format = (amount: number) => formatCurrency(currency, amount);
  const displayBalance = showBalances ? format(Number(primary.amount)) : `${currency} ******`;

  const assetBalance = (symbol: string) =>
    Number(balances.find((balance) => balance.currency === symbol)?.amount ?? 0);

  const assetRate = (asset: CryptoAsset) => Number(asset.mock_rate_usd) || 0;

  const hasCrypto = assets.length > 0;

  const totalPortfolio =
    Number(primary.amount) +
    assets.reduce((sum, asset) => sum + assetBalance(asset.symbol) * assetRate(asset), 0);

  return (
    <>
      <div className="hidden lg:block">
        <HeroCard
          siteName={site.name}
          accountLast4={accountLast4}
          fullName={fullName}
          isActive={isActive}
          isVerified={isVerified}
          currency={currency}
          displayBalance={displayBalance}
          showBalances={showBalances}
          onToggleBalance={() => setShowBalances((value) => !value)}
          hasCrypto={hasCrypto}
          assets={assets}
          assetBalance={assetBalance}
          assetRate={assetRate}
          format={format}
          totalPortfolio={totalPortfolio}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <RecentTransactions transactions={formattedTransactions} />
            <QuickActions />
            <QuickTransfer beneficiaries={topBeneficiaries} />
            <ActiveCards cards={activeCards} fullName={fullName} siteName={site.name} />
          </div>

          <div className="space-y-4">
            <AccountStatistics pending={stats.pending} volume={stats.volume} format={format} />
            <SupportCard />
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <MobileDashboard
          site={site}
          user={user}
          fullName={fullName}
          currency={currency}
          displayBalance={displayBalance}
          showBalances={showBalances}
          onToggleBalance={() => setShowBalances((value) => !value)}
          accountLast4={accountLast4}
          isActive={isActive}
          hasCrypto={hasCrypto}
          assets={assets}
          assetBalance={assetBalance}
          assetRate={assetRate}
          format={format}
          transactions={formattedTransactions}
        />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop hero                                                        */
/* ------------------------------------------------------------------ */

interface HeroCardProps {
  siteName: string;
  accountLast4: string;
  fullName: string;
  isActive: boolean;
  isVerified: boolean;
  currency: string;
  displayBalance: string;
  showBalances: boolean;
  onToggleBalance: () => void;
  hasCrypto: boolean;
  assets: CryptoAsset[];
  assetBalance: (symbol: string) => number;
  assetRate: (asset: CryptoAsset) => number;
  format: (amount: number) => string;
  totalPortfolio: number;
}

function HeroCard({
  siteName,
  accountLast4,
  fullName,
  isActive,
  isVerified,
  currency,
  displayBalance,
  showBalances,
  onToggleBalance,
  hasCrypto,
  assets,
  assetBalance,
  assetRate,
  format,
  totalPortfolio,
}: HeroCardProps) {
  return (
    <div className="mb-6">
      <div
        className="relative overflow-hidden rounded-[24px] p-6 text-white shadow-soft"
        style={{
          background: "linear-gradient(135deg, var(--brand), rgba(0,0,0,0.32))",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
              <i className="fa-solid fa-landmark text-lg" />
            </div>
            <div>
              <p className="text-xl font-semibold">{siteName}</p>
              <p className="text-sm text-white/80">Primary Account</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/15 px-4 py-3 text-right shadow-inner backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-white/70">Account Number</p>
            <p className="text-lg font-semibold tracking-[0.2em]">•••• {accountLast4}</p>
          </div>
        </div>

        <div
          className={`relative mt-6 grid grid-cols-1 items-start gap-4 ${
            hasCrypto ? "md:grid-cols-3" : "md:grid-cols-2"
          }`}
        >
          <div className="space-y-3">
            <p className="text-sm text-white/80">Account Holder</p>
            <p className="text-xl font-semibold leading-tight">{fullName}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-lime-300" : "bg-red-300"}`}
                />
                <span className="font-semibold">{isActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${isVerified ? "bg-emerald-300" : "bg-amber-300"}`}
                />
                <span className="font-semibold">
                  {isVerified ? "Verified & Secured" : "Verification Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-center">
            <p className="text-sm text-white/80">Fiat Balance</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-4xl font-extrabold leading-none">{displayBalance}</p>
              <button
                onClick={onToggleBalance}
                className="text-white/80 transition-colors hover:text-white"
              >
                <i className={`fa-solid ${showBalances ? "fa-eye-slash" : "fa-eye"} text-xl`} />
              </button>
            </div>
            <p className="text-sm text-white/80">{currency} Balance</p>
          </div>

          {hasCrypto && (
            <div className="space-y-2 text-right">
              <p className="text-sm text-white/80">Crypto Balances</p>
              <div className="grid grid-cols-1 gap-3">
                {assets.map((asset) => (
                  <div
                    key={asset.symbol}
                    className="rounded-2xl border border-white/15 bg-white/[0.12] px-4 py-3 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <i className={`${cryptoIcon(asset.symbol)} text-base`} />
                        {asset.name}
                      </span>
                      <span className="text-xs text-white/75">
                        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-orange-300" />1{" "}
                        {asset.symbol} = {format(assetRate(asset))}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xl font-bold">
                        {showBalances
                          ? assetBalance(asset.symbol).toLocaleString(undefined, {
                              maximumFractionDigits: 6,
                            })
                          : "••••"}{" "}
                        {asset.symbol}
                      </p>
                      {showBalances && (
                        <p className="text-xs text-white/80">
                          ≈ {format(assetBalance(asset.symbol) * assetRate(asset))}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-white/10 blur-xl" />
            <div className="relative rounded-3xl border border-white/10 bg-white/15 px-5 py-4 shadow backdrop-blur-md">
              <p className="text-sm text-white/80">Total Portfolio</p>
              <p className="mt-1 text-2xl font-extrabold">{format(totalPortfolio)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/transfer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-2.5 text-sm font-semibold shadow transition-colors hover:bg-white/25"
            >
              <i className="fa-solid fa-paper-plane text-base" />
              <span>Send Money</span>
            </Link>
            <Link
              href="/deposit"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold shadow transition hover:shadow-lg"
              style={{ color: "var(--brand)" }}
            >
              <i className="fa-solid fa-plus text-sm" />
              <span>Add Money</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

function PanelCard({ children, pad = true }: { children: React.ReactNode; pad?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${
        pad ? "p-4" : ""
      }`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recent transactions                                                 */
/* ------------------------------------------------------------------ */

interface TransactionRow {
  id: string;
  credit: boolean;
  name: string;
  date: string;
  amount: string;
}

function RecentTransactions({ transactions }: { transactions: TransactionRow[] }) {
  return (
    <PanelCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <Link
          href="/transactions"
          className="text-xs font-medium hover:opacity-80"
          style={{ color: "var(--brand)" }}
        >
          View All
        </Link>
      </div>
      {transactions.length === 0 ? (
        <div className="py-6 text-center">
          <i className="fa-solid fa-receipt mb-2 text-2xl text-gray-300 dark:text-gray-600" />
          <p className="text-xs text-gray-500 dark:text-gray-400">No recent transactions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.slice(0, 4).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full ${
                    tx.credit ? "bg-green-500/10" : "bg-red-500/10"
                  }`}
                >
                  <i
                    className={`fa-solid ${
                      tx.credit
                        ? "fa-arrow-down-left text-green-600 dark:text-green-400"
                        : "fa-arrow-up-right text-red-600 dark:text-red-400"
                    } text-xs`}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{tx.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{tx.date}</p>
                </div>
              </div>
              <p
                className={`text-xs font-semibold ${
                  tx.credit
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {tx.amount}
              </p>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

/* ------------------------------------------------------------------ */
/* Quick actions                                                       */
/* ------------------------------------------------------------------ */

function QuickActionLink({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <div className={`mb-2 grid h-10 w-10 place-items-center rounded-lg ${color}`}>
        <i className={`${icon} text-sm text-white`} />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
    </Link>
  );
}

function QuickActions() {
  return (
    <PanelCard>
      <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickActionLink
          href="/transfer"
          icon="fa-solid fa-exchange-alt"
          label="Transfer"
          color="bg-blue-500"
        />
        <QuickActionLink
          href="/transfer#international"
          icon="fa-solid fa-file-invoice"
          label="Pay Bills"
          color="bg-green-500"
        />
        <QuickActionLink
          href="/deposit"
          icon="fa-solid fa-building-columns"
          label="Bank Details"
          color="bg-[var(--brand)]"
        />
        <QuickActionLink
          href="/cards"
          icon="fa-solid fa-credit-card"
          label="Cards"
          color="bg-purple-500"
        />
      </div>
    </PanelCard>
  );
}

/* ------------------------------------------------------------------ */
/* Quick transfer (beneficiaries)                                      */
/* ------------------------------------------------------------------ */

function QuickTransfer({ beneficiaries }: { beneficiaries: Beneficiary[] }) {
  return (
    <PanelCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Quick Transfer</h3>
        <Link
          href="/beneficiaries"
          className="flex items-center text-xs font-medium hover:opacity-80"
          style={{ color: "var(--brand)" }}
        >
          View All <i className="fa-solid fa-chevron-right ml-1 text-xs" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        <Link
          href="/transfer"
          className="group flex flex-shrink-0 flex-col items-center justify-center"
        >
          <div className="mb-2 grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition group-hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:group-hover:bg-gray-700">
            <i className="fa-solid fa-plus text-lg text-gray-400 dark:text-gray-500" />
          </div>
          <span className="text-center text-xs text-gray-500 dark:text-gray-400">Add New</span>
        </Link>

        {beneficiaries.map((beneficiary) => (
          <Link
            key={beneficiary.id}
            href="/transfer"
            className="group flex flex-shrink-0 flex-col items-center justify-center"
          >
            <div
              className="relative mb-2 grid h-16 w-16 place-items-center rounded-full border-2 border-white text-base font-semibold text-white shadow-sm transition hover:scale-105 dark:border-gray-800"
              style={{ background: "var(--brand)" }}
            >
              {beneficiary.name.slice(0, 2).toUpperCase()}
              {beneficiary.favorite && (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-yellow-400">
                  <i className="fa-solid fa-star text-[10px] text-white" />
                </span>
              )}
            </div>
            <span className="max-w-16 truncate text-center text-xs text-gray-700 dark:text-gray-300">
              {beneficiary.name}
            </span>
          </Link>
        ))}

        {beneficiaries.length === 0 && (
          <div className="flex flex-shrink-0 flex-col items-center justify-center px-8 py-6">
            <div className="mb-3 grid h-16 w-16 place-items-center rounded-full bg-gray-100 dark:bg-gray-800">
              <i className="fa-solid fa-users text-xl text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              No saved beneficiaries
            </p>
            <p className="mt-1 text-center text-xs text-gray-400 dark:text-gray-500">
              Add one to get started
            </p>
          </div>
        )}
      </div>
    </PanelCard>
  );
}

/* ------------------------------------------------------------------ */
/* Active cards                                                        */
/* ------------------------------------------------------------------ */

function ActiveCards({
  cards,
  fullName,
  siteName,
}: {
  cards: Card[];
  fullName: string;
  siteName: string;
}) {
  return (
    <PanelCard pad={false}>
      <div className="flex items-center justify-between border-b border-gray-200/70 px-4 py-2 dark:border-gray-700/50">
        <div className="flex items-center">
          <div
            className="mr-2 grid h-6 w-6 place-items-center rounded-lg text-white"
            style={{ background: "var(--brand)" }}
          >
            <i className="fa-solid fa-credit-card text-xs" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Your Active Cards</h3>
        </div>
        {cards.length > 0 && (
          <Link
            href="/cards"
            className="flex items-center text-xs font-medium hover:opacity-80"
            style={{ color: "var(--brand)" }}
          >
            Manage Cards <i className="fa-solid fa-chevron-right ml-1 text-xs" />
          </Link>
        )}
      </div>

      <div className="p-3">
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {cards.slice(0, 2).map((card) => (
              <div
                key={card.id}
                className="overflow-hidden rounded-xl border border-gray-200/70 dark:border-gray-700/50"
              >
                <div className="p-3">
                  <div
                    className="relative h-32 w-full overflow-hidden rounded-xl text-white"
                    style={{
                      background: "linear-gradient(135deg, var(--brand), rgba(0,0,0,0.55))",
                    }}
                  >
                    <div className="absolute inset-0 flex flex-col justify-between p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-semibold tracking-wide">{siteName}</div>
                          <div className="text-xs opacity-70">Virtual Card</div>
                        </div>
                        <i className="fa-solid fa-credit-card text-lg" />
                      </div>
                      <div className="font-mono text-sm tracking-widest">
                        {card.card_number_masked}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-xs opacity-70">Card Holder</div>
                          <div className="truncate text-xs font-medium">{fullName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs opacity-70">Valid</div>
                          <div className="text-xs font-medium">
                            {card.expires_at
                              ? new Date(card.expires_at).toLocaleDateString(undefined, {
                                  month: "2-digit",
                                  year: "2-digit",
                                })
                              : "--"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-3 pb-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium capitalize"
                        style={{ color: "var(--brand)" }}
                      >
                        {card.card_brand} Card
                      </span>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <span className="mr-1 h-1 w-1 rounded-full bg-green-500" />
                        Active
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(card.currency, Number(card.balance))}
                    </div>
                  </div>
                  <Link
                    href={`/cards/${card.id}`}
                    className="block rounded-lg bg-gray-100 px-3 py-1.5 text-center text-xs font-medium transition hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                    style={{ color: "var(--brand)" }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-gray-100 dark:bg-gray-700">
              <i className="fa-solid fa-credit-card text-lg" style={{ color: "var(--brand)" }} />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
              No active cards
            </h3>
            <p className="mb-3 max-w-xs text-xs text-gray-500 dark:text-gray-400">
              Apply for a virtual card to get started with secure online payments.
            </p>
            <Link
              href="/cards/apply"
              className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:scale-105"
              style={{ background: "var(--brand)" }}
            >
              <i className="fa-solid fa-plus mr-1.5 text-xs" />
              Apply for Card
            </Link>
          </div>
        )}
      </div>
    </PanelCard>
  );
}

/* ------------------------------------------------------------------ */
/* Account statistics                                                  */
/* ------------------------------------------------------------------ */

function StatRow({
  label,
  value,
  desc,
  icon,
  bg,
}: {
  label: string;
  value: string;
  desc: string;
  icon: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50/50 to-white/50 p-2 dark:border-gray-600/50 dark:from-gray-700/50 dark:to-gray-800/50">
      <div className="flex items-center">
        <div
          className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${bg} shadow-md`}
        >
          <i className={`${icon} text-xs text-white`} />
        </div>
        <div className="ml-3 min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function AccountStatistics({
  pending,
  volume,
  format,
}: {
  pending: number;
  volume: number;
  format: (amount: number) => string;
}) {
  return (
    <PanelCard pad={false}>
      <div className="flex items-center border-b border-gray-200/70 px-4 py-2 dark:border-gray-700/50">
        <div className="mr-2 grid h-6 w-6 place-items-center rounded-lg bg-slate-500">
          <i className="fa-solid fa-chart-line text-xs text-white" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Account Statistics</h3>
      </div>
      <div className="space-y-2 p-3">
        <StatRow
          label="Transaction Limit"
          value="Unlimited"
          desc="Daily limit available"
          icon="fa-solid fa-gauge-high"
          bg="from-[var(--brand)] to-[var(--brand)]"
        />
        <StatRow
          label="Pending Transactions"
          value={format(pending)}
          desc="Awaiting processing"
          icon="fa-solid fa-hourglass-half"
          bg="from-yellow-400 to-yellow-500"
        />
        <StatRow
          label="Total Volume"
          value={format(volume)}
          desc="Recent transactions"
          icon="fa-solid fa-chart-pie"
          bg="from-green-500 to-green-600"
        />
      </div>
      <div className="flex items-center justify-center border-t border-gray-200/70 px-3 py-2 text-xs text-gray-500 dark:border-gray-700/50 dark:text-gray-400">
        <i className="fa-solid fa-clock mr-1 text-xs" style={{ color: "var(--brand)" }} />
        <span>Updated in real-time</span>
      </div>
    </PanelCard>
  );
}

/* ------------------------------------------------------------------ */
/* Support card                                                        */
/* ------------------------------------------------------------------ */

function SupportCard() {
  return (
    <PanelCard>
      <div className="mb-3 flex items-center justify-center">
        <div className="relative">
          <div
            className="grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg"
            style={{ background: "var(--brand)" }}
          >
            <i className="fa-solid fa-headset text-sm" />
          </div>
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border border-white bg-green-500 dark:border-gray-800" />
        </div>
      </div>
      <div className="mb-3 text-center">
        <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-white">Need Assistance?</h3>
        <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
          Contact support when you need help with your account
        </p>
        <div
          className="flex items-center justify-center text-xs font-semibold"
          style={{ color: "var(--brand)" }}
        >
          <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
          <span>Live Chat Support</span>
        </div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="flex items-center rounded-xl border border-gray-100 bg-white/60 p-2 dark:border-gray-600/70 dark:bg-gray-700/60">
          <div className="mr-2 grid h-6 w-6 place-items-center rounded-lg bg-slate-100 dark:bg-gray-600/50">
            <i className="fa-solid fa-clock text-xs text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">Quick Response</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">&lt; 5 minutes</p>
          </div>
        </div>
        <div className="flex items-center rounded-xl border border-gray-100 bg-white/60 p-2 dark:border-gray-600/70 dark:bg-gray-700/60">
          <div className="mr-2 grid h-6 w-6 place-items-center rounded-lg bg-green-100 dark:bg-green-900/50">
            <i className="fa-solid fa-shield-check text-xs text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">Secure Chat</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Encrypted</p>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <Link
          href="/support"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:scale-105"
          style={{ background: "var(--brand)" }}
        >
          <i className="fa-solid fa-comments mr-2 text-xs" />
          <span>Start Live Chat</span>
        </Link>
      </div>
    </PanelCard>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile dashboard                                                    */
/* ------------------------------------------------------------------ */

interface MobileDashboardProps {
  site: { name: string; brand_color?: string };
  user: {
    photo_url?: string;
    first_name?: string;
    account_number?: string;
    id: number;
    status: string;
  };
  fullName: string;
  currency: string;
  displayBalance: string;
  showBalances: boolean;
  onToggleBalance: () => void;
  accountLast4: string;
  isActive: boolean;
  hasCrypto: boolean;
  assets: CryptoAsset[];
  assetBalance: (symbol: string) => number;
  assetRate: (asset: CryptoAsset) => number;
  format: (amount: number) => string;
  transactions: TransactionRow[];
}

function MobileDashboard({
  site,
  user,
  fullName,
  currency,
  displayBalance,
  showBalances,
  onToggleBalance,
  accountLast4,
  isActive,
  hasCrypto,
  assets,
  assetBalance,
  assetRate,
  format,
  transactions,
}: MobileDashboardProps) {
  return (
    <>
      <div className="-mx-4 -mt-5 rounded-b-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 pb-8 pt-6 text-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-provided avatar
              <img
                src={user.photo_url}
                alt={fullName}
                className="h-10 w-10 rounded-full border-2 border-white/20 object-cover"
              />
            ) : (
              <span
                className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/20 text-sm font-semibold text-white"
                style={{ background: site.brand_color || "#0ea5e9" }}
              >
                {fullName.trim().slice(0, 1).toUpperCase() || "?"}
              </span>
            )}
            <div>
              <p className="text-xs text-white/80">{greeting()},</p>
              <p className="text-base font-semibold">{fullName}</p>
            </div>
          </div>
          <MobileThemeToggle />
        </div>

        <div
          className="relative overflow-hidden rounded-3xl p-6"
          style={{
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-1 opacity-80"
            style={{ background: "linear-gradient(90deg, var(--brand), rgba(255,255,255,0.4))" }}
          />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Fiat Balance
              </p>
              <p className="mt-0.5 text-sm font-bold text-white">{currency} Account</p>
            </div>
            <div className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-400">
              **** {accountLast4}
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <p className="text-xs text-slate-400">Available Funds</p>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-3xl font-bold tracking-tight text-white">{displayBalance}</p>
              <button
                onClick={onToggleBalance}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <i className={`fa-solid ${showBalances ? "fa-eye-slash" : "fa-eye"} text-xs`} />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-400">
              <span className="font-medium">Account Status</span>
              <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
                <span
                  className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-400" : "bg-red-400"}`}
                />
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <MobileActionButton href="/deposit" icon="fa-solid fa-plus" label="Top Up" highlight />
          <MobileActionButton href="/transfer" icon="fa-solid fa-paper-plane" label="Send" />
          <MobileActionButton href="/transactions" icon="fa-solid fa-chart-line" label="Activity" />
        </div>

        {hasCrypto && (
          <div className="mt-5">
            <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
              Crypto Balances
            </h3>
            <div className="space-y-2">
              {assets.map((asset) => (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between rounded-xl border border-gray-200/70 bg-white p-3 dark:border-gray-700/50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <i
                        className={`${cryptoIcon(asset.symbol)} text-amber-600 dark:text-amber-400`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {asset.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        1 {asset.symbol} = {format(assetRate(asset))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {showBalances
                        ? assetBalance(asset.symbol).toLocaleString(undefined, {
                            maximumFractionDigits: 6,
                          })
                        : "••••"}{" "}
                      {asset.symbol}
                    </p>
                    {showBalances && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ≈ {format(assetBalance(asset.symbol) * assetRate(asset))}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Recent Transactions
          </h3>
          <Link
            href="/transactions"
            className="text-xs font-medium hover:opacity-80"
            style={{ color: "var(--brand)" }}
          >
            View All
          </Link>
        </div>
        {transactions.length === 0 ? (
          <div className="rounded-xl border border-gray-200/70 bg-white py-8 text-center dark:border-gray-700/50 dark:bg-gray-800">
            <i className="fa-solid fa-receipt mb-2 text-2xl text-gray-300 dark:text-gray-600" />
            <p className="text-xs text-gray-500 dark:text-gray-400">No recent transactions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl border border-gray-200/70 bg-white p-3 dark:border-gray-700/50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-full ${
                      tx.credit ? "bg-green-500/10" : "bg-red-500/10"
                    }`}
                  >
                    <i
                      className={`fa-solid ${
                        tx.credit
                          ? "fa-arrow-down-left text-green-600 dark:text-green-400"
                          : "fa-arrow-up-right text-red-600 dark:text-red-400"
                      } text-sm`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tx.date}</p>
                  </div>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    tx.credit
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {tx.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/** Mobile-specific theme toggle (white translucent button over the dark header). */
function MobileThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur-sm transition hover:bg-white/20"
    >
      <i
        className={`fa-solid ${isDark ? "fa-sun text-yellow-400" : "fa-moon text-white"} text-base`}
      />
    </button>
  );
}

function MobileActionButton({
  href,
  icon,
  label,
  highlight,
}: {
  href: string;
  icon: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center">
      <div
        className={`mb-1 grid h-14 w-14 place-items-center rounded-full ${
          highlight
            ? "bg-yellow-400 shadow-lg"
            : "border border-white/10 bg-white/20 backdrop-blur-sm"
        }`}
      >
        <i className={`${icon} text-lg ${highlight ? "text-black" : "text-white"}`} />
      </div>
      <span className="text-xs font-medium text-white">{label}</span>
    </Link>
  );
}
