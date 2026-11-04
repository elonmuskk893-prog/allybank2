"use client";

import { useEffect, useState } from "react";
import Link from "@/lib/next/link";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { Loader } from "@/components/ui/loader";
import { bankFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface CardData {
  id: number | string;
  card_brand: string;
  card_number_masked: string;
  expires_at?: string | null;
  balance: number | string;
  currency: string;
  status: string;
  daily_limit?: number | string | null;
}

interface CardsResponse {
  cards: CardData[];
}

export default function CardsPage() {
  return (
    <AppShell>
      <Cards />
    </AppShell>
  );
}

function Cards() {
  const me = useMe();
  const currency = me.site.primary_currency;
  const holder = [me.user.first_name, me.user.last_name].filter(Boolean).join(" ") || me.user.email;

  const [cards, setCards] = useState<CardData[] | null>(null);

  useEffect(() => {
    (async () => {
      const res = await bankFetch<CardsResponse>("/cards");
      setCards(res.ok && res.data?.cards ? res.data.cards : []);
    })();
  }, []);

  if (cards === null) return <Loader />;

  const activeCount = cards.filter((c) => c.status === "active").length;
  const pendingCount = cards.filter((c) => c.status === "pending").length;
  const totalBalance = cards.reduce((sum, c) => sum + Number(c.balance), 0);

  return (
    <div className="-mx-4 -my-5 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 lg:-mx-6 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 hidden lg:block">
          <div className="flex items-center justify-between">
            <div className="mb-2 flex items-center gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-xl text-white"
                style={{ background: "var(--brand)" }}
              >
                <i className="fas fa-credit-card text-lg" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Virtual Cards</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Secure virtual cards for online payments and subscriptions
                </p>
              </div>
            </div>
            <Link
              href="/cards/apply"
              className="inline-flex items-center rounded-xl px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02]"
              style={{ background: "var(--brand)" }}
            >
              <i className="fas fa-plus mr-2" />
              Apply for Card
            </Link>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            icon="fa-credit-card"
            grad="var(--brand)"
            label="Active Cards"
            value={String(activeCount)}
          />
          <StatCard
            icon="fa-hourglass-half"
            grad="linear-gradient(to right,#f59e0b,#ea580c)"
            label="Pending Applications"
            value={String(pendingCount)}
          />
          <StatCard
            icon="fa-wallet"
            grad="linear-gradient(to right,#22c55e,#059669)"
            label="Total Balance"
            value={formatCurrency(currency, totalBalance)}
          />
        </div>

        <div
          className="mb-4 overflow-hidden rounded-2xl border border-white/20 shadow-xl dark:border-gray-700/50"
          style={{ background: "linear-gradient(135deg, var(--brand), rgba(0,0,0,0.4))" }}
        >
          <div className="relative p-6">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-bold text-white lg:text-2xl">
                  Virtual Cards Made Easy
                </h2>
                <p className="mb-4 text-sm text-white/90">
                  Apply for a virtual card for online payments and review the available controls for
                  supported cards.
                </p>
                <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    ["fa-shield-alt", "Secure", "Protected payments"],
                    ["fa-globe", "Networks", "Where supported"],
                    ["fa-sliders-h", "Control", "Spending limits"],
                    ["fa-hourglass-half", "Review", "Subject to approval"],
                  ].map(([icon, title, desc]) => (
                    <div key={title} className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 backdrop-blur-sm">
                        <i className={`fas ${icon} text-sm text-white`} />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-white">{title}</h3>
                        <p className="text-xs text-white/80">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="lg:hidden">
                  <Link
                    href="/cards/apply"
                    className="inline-flex items-center rounded-xl border border-white/30 bg-white/20 px-4 py-2 font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
                  >
                    <i className="fas fa-plus mr-2" />
                    Apply Now
                  </Link>
                </div>
              </div>
              <div className="hidden lg:flex lg:w-1/3 lg:items-center lg:justify-center lg:pl-6">
                <div className="relative h-32 w-48">
                  <div className="absolute h-full w-full rotate-6 rounded-xl bg-gray-900/40 shadow-lg backdrop-blur-sm" />
                  <div
                    className="absolute h-full w-full rounded-xl border border-white/20 shadow-lg backdrop-blur-sm"
                    style={{
                      background:
                        "linear-gradient(to right, rgba(0,0,0,0.3), rgba(255,255,255,0.15))",
                    }}
                  >
                    <div className="flex h-full flex-col justify-between p-4 text-white">
                      <div className="flex items-start justify-between">
                        <div className="font-mono text-xs text-white/75">Virtual Card</div>
                        <i className="fas fa-wifi rotate-90 text-sm text-white/75" />
                      </div>
                      <div className="mt-4 font-mono text-xs text-white">
                        {"•••• •••• •••• 1234"}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="font-mono text-xs text-white/75">VALID THRU</div>
                          <div className="font-mono text-xs text-white">12/25</div>
                        </div>
                        <i className="fas fa-credit-card text-lg text-white/75" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95">
          <div className="flex items-center justify-between border-b border-gray-200/50 px-6 py-4 dark:border-gray-700/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Cards</h2>
            <Link
              href="/cards/apply"
              className="flex items-center text-sm font-medium hover:opacity-80"
              style={{ color: "var(--brand)" }}
            >
              <i className="fas fa-plus-circle mr-1" />
              New Card
            </Link>
          </div>
          {cards.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <CardTile
                  key={card.id}
                  card={card}
                  cur={currency}
                  siteName={me.site.name}
                  holder={holder}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div
                className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl text-white"
                style={{ background: "var(--brand)" }}
              >
                <i className="fas fa-credit-card text-2xl" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                No Cards Yet
              </h3>
              <p className="mx-auto mb-6 max-w-sm text-gray-500 dark:text-gray-400">
                Review the application requirements before applying for a virtual card.
              </p>
              <Link
                href="/cards/apply"
                className="inline-flex items-center rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02]"
                style={{ background: "var(--brand)" }}
              >
                <i className="fas fa-plus mr-2" />
                Apply for Your First Card
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  grad,
  label,
  value,
}: {
  icon: string;
  grad: string;
  label: string;
  value: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95">
      <div className="flex items-center p-4">
        <div className="shrink-0 rounded-xl p-3" style={{ background: grad }}>
          <i className={`fas ${icon} text-lg text-white`} />
        </div>
        <div className="ml-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function CardTile({
  card,
  cur,
  siteName,
  holder,
}: {
  card: CardData;
  cur: string;
  siteName: string;
  holder: string;
}) {
  const last4 = card.card_number_masked.replace(/\D/g, "").slice(-4) || "****";
  const expiry = card.expires_at
    ? new Date(card.expires_at).toLocaleDateString(undefined, {
        month: "2-digit",
        year: "2-digit",
      })
    : "--/--";
  const gradient = "linear-gradient(135deg, var(--brand), rgba(0,0,0,0.6))";
  const badge = {
    active: [
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
      "fa-check-circle",
      "Active",
    ],
    pending: [
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
      "fa-clock",
      "Pending",
    ],
    expired: [
      "bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300",
      "fa-pause",
      "Inactive",
    ],
    blocked: ["bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300", "fa-lock", "Blocked"],
  }[card.status] ?? [
    "bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300",
    "fa-pause",
    "Inactive",
  ];

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-sm transition hover:shadow-lg dark:border-gray-700/50 dark:bg-gray-800/80">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${badge[0]}`}
        >
          <i className={`fas ${badge[1]} mr-1`} />
          {badge[2]}
        </span>
        <div className="text-xs font-medium capitalize text-gray-500 dark:text-gray-400">
          {card.card_brand}
        </div>
      </div>
      <div className="px-4 py-3">
        <div
          className="relative h-40 w-full overflow-hidden rounded-xl"
          style={{ background: gradient }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute right-0 top-0 h-24 w-24 -translate-y-12 translate-x-12 rounded-full bg-white/10" />
            <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-16 translate-y-16 rounded-full bg-white/5" />
          </div>
          <div className="relative flex h-full flex-col justify-between p-4 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold opacity-90">{siteName}</div>
                <div className="text-xs opacity-70">Virtual Card</div>
              </div>
              <div className="text-xs font-bold uppercase">{card.card_brand}</div>
            </div>
            <div className="grid h-6 w-8 grid-cols-2 grid-rows-2 gap-px rounded bg-gradient-to-br from-yellow-400 to-yellow-500 p-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-sm bg-yellow-600/60" />
              ))}
            </div>
            <div className="font-mono text-sm tracking-wider">
              {"•••• •••• •••• "}
              {last4}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs uppercase opacity-70">Card Holder</div>
                <div className="max-w-[120px] truncate text-xs font-medium">{holder}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase opacity-70">Valid Thru</div>
                <div className="text-xs font-medium">{expiry}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Balance</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {formatCurrency(card.currency, Number(card.balance))}
          </span>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Daily Limit</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {card.daily_limit != null
              ? formatCurrency(card.currency, Number(card.daily_limit))
              : "Unlimited"}
          </span>
        </div>
        <div className="flex space-x-2">
          <Link
            href={`/cards/${card.id}`}
            className="flex-1 rounded-lg px-3 py-2 text-center text-xs font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            View Details
          </Link>
          <Link
            href={`/cards/${card.id}`}
            className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-center text-xs font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Transactions
          </Link>
        </div>
      </div>
    </div>
  );
}
