"use client";

import { useEffect, useState } from "react";
import Link from "@/lib/next/link";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { KycGate } from "@/components/dashboard/kyc-gate";
import { bankFetch } from "@/lib/api";
import { formatCurrency, parseNumeric, sanitizeAmount } from "@/lib/format";
import {
  CustomFieldsEditor,
  missingFieldLabel,
  uploadFile,
  type CustomField,
} from "@/components/dashboard/custom-fields";

const DESTINATIONS = [
  {
    value: "bank",
    label: "Bank account",
    icon: "fa-solid fa-landmark",
    placeholder: "Account number / IBAN",
  },
  {
    value: "btc",
    label: "Bitcoin (BTC)",
    icon: "fa-brands fa-bitcoin",
    placeholder: "BTC wallet address",
  },
  {
    value: "usdt",
    label: "Stablecoin (USDT)",
    icon: "fa-solid fa-coins",
    placeholder: "USDT wallet address",
  },
  {
    value: "crypto",
    label: "Other crypto",
    icon: "fa-solid fa-wallet",
    placeholder: "",
  },
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

interface WithdrawalRecord {
  id: number | string;
  currency: string;
  amount: string | number;
  destination?: { kind?: string } | null;
  created_at: string;
  status: string;
  admin_note?: string | null;
  otp_verified_at?: string | null;
}

interface RawMethod {
  id: number | string;
  name: string;
  type: string;
  emoji?: string;
  minimum?: string | number | null;
  maximum?: string | number | null;
  charges_amount?: string | number | null;
  charges_type?: string;
  duration?: string;
  custom_fields?: CustomField[];
}

interface WithdrawMethod {
  id: number | string;
  kind: string;
  label: string;
  details: Record<string, unknown>;
  min_amount?: string | number | null;
  max_amount?: string | number | null;
  charge_type?: string;
  charge_amount?: string | number | null;
  duration?: string;
  custom_fields?: CustomField[];
}

export default function WithdrawPage() {
  return (
    <AppShell>
      <KycGate action="withdraw money">
        <WithdrawFlow />
      </KycGate>
    </AppShell>
  );
}

function WithdrawFlow() {
  const me = useMe();
  const brand = me.site.brand_color || "#0ea5e9";
  const currency = me.site.primary_currency;

  const [step, setStep] = useState("form");
  const [amount, setAmount] = useState("");
  const [methods, setMethods] = useState<WithdrawMethod[]>([]);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [kind, setKind] = useState("bank");
  const [destination, setDestination] = useState("");
  const [network, setNetwork] = useState("");
  const [coin, setCoin] = useState("");
  const [wallet, setWallet] = useState("");
  const [memo, setMemo] = useState("");
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [pin, setPin] = useState("");
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);

  async function loadWithdrawals() {
    const res = await bankFetch<{ withdrawals: WithdrawalRecord[] }>("/withdrawals");
    if (res.ok && res.data?.withdrawals) {
      setWithdrawals(res.data.withdrawals);
    }
  }

  async function loadMethods() {
    const res = await bankFetch<{ methods: RawMethod[] }>(
      "/payment-methods?for=withdrawal",
    );
    if (res.ok && res.data?.methods) {
      setMethods(
        res.data.methods.map((method) => ({
          id: method.id,
          kind: method.emoji ? `${method.emoji} ${method.type}` : method.type,
          label: method.name,
          details: {},
          min_amount: method.minimum,
          max_amount: method.maximum,
          charge_type: method.charges_type,
          charge_amount: method.charges_amount,
          duration: method.duration,
          custom_fields: method.custom_fields,
        })),
      );
      if (res.data.methods.length > 0 && selectedId == null) {
        setSelectedId(res.data.methods[0].id);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!amount || parseNumeric(amount) <= 0) {
      setError("Enter an amount");
      return;
    }
    if (methods.length === 0) {
      if (kind === "crypto") {
        if (!network.trim() || !coin.trim() || !wallet.trim()) {
          setError("Enter the network, coin, and wallet address");
          return;
        }
      } else if (!destination.trim()) {
        setError("Enter where to send the money");
        return;
      }
    }
    const method = methods.find((m) => m.id === selectedId);
    const customFields = method?.custom_fields ?? [];
    if (method) {
      const value = parseNumeric(amount);
      if (method.min_amount != null && value < Number(method.min_amount)) {
        setError(
          `Minimum for this method is ${formatCurrency(currency, Number(method.min_amount))}.`,
        );
        return;
      }
      if (method.max_amount != null && value > Number(method.max_amount)) {
        setError(
          `Maximum for this method is ${formatCurrency(currency, Number(method.max_amount))}.`,
        );
        return;
      }
      const missing = missingFieldLabel(customFields, custom);
      if (missing) {
        setError(`Please fill in ${missing}.`);
        return;
      }
    }
    if (pin.length < 4) {
      setError("Enter your transaction PIN");
      return;
    }
    setBusy(true);
    const destinationBody =
      kind === "crypto"
        ? {
            kind: "crypto",
            network: network.trim(),
            coin_name: coin.trim(),
            wallet_address: wallet.trim(),
            ...(memo.trim() ? { memo: memo.trim() } : {}),
          }
        : { kind, detail: destination.trim() };
    const body =
      methods.length > 0 && selectedId != null
        ? {
            amount: parseNumeric(amount),
            method_id: selectedId,
            ...(customFields.length ? { custom } : {}),
            pin,
          }
        : { amount: parseNumeric(amount), destination: destinationBody, pin };
    const res = await bankFetch<{ withdrawal_id: string }>("/withdrawal/request", {
      method: "POST",
      body,
    });
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(
        res.errorCode === "insufficient_balance"
          ? "Not enough balance for this withdrawal."
          : (res.error ?? "Failed"),
      );
      return;
    }
    setAmount("");
    setDestination("");
    setPin("");
    setCode("");
    setWithdrawalId(res.data.withdrawal_id);
  }

  async function handleVerify(e?: { preventDefault?: () => void }) {
    if (e?.preventDefault) e.preventDefault();
    if (!withdrawalId) return;
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code");
      return;
    }
    setBusy(true);
    const res = await bankFetch("/withdrawal/verify", {
      method: "POST",
      body: { withdrawal_id: withdrawalId, code },
    });
    setBusy(false);
    if (!res.ok) {
      setError(
        res.errorCode === "invalid_code"
          ? "Wrong or expired code"
          : (res.error ?? "Failed"),
      );
      return;
    }
    setWithdrawalId(null);
    setCode("");
    setError(null);
    setStep("done");
    loadWithdrawals();
  }

  useEffect(() => {
    loadWithdrawals();
    loadMethods();
    const interval = setInterval(() => {
      loadWithdrawals();
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const selected = methods.find((m) => m.id === selectedId) ?? null;
  const editableFields = (selected?.custom_fields ?? []).filter(
    (field) => field.role === "input" || field.role === "display",
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-xl dark:border-gray-700/50 dark:bg-gray-800">
        <div
          className="relative overflow-hidden p-6 text-center text-white"
          style={{
            background: `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.35))`,
          }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
              <i className="fa-solid fa-arrow-up-from-bracket text-2xl" />
            </div>
            <h2 className="text-2xl font-bold">Withdraw Funds</h2>
            <p className="mt-1 text-sm text-white/90">
              {step === "done"
                ? "Your withdrawal is in review"
                : "Choose your destination and amount to cash out"}
            </p>
          </div>
        </div>

        {step === "form" && (
          <form onSubmit={handleSubmit} className="p-6">
            <label className="mb-4 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Where should we send it?
            </label>

            {methods.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {methods.map((method) => {
                    const active = selectedId === method.id;
                    const chargeLabel =
                      method.charge_amount != null
                        ? method.charge_type === "percent"
                          ? `${method.charge_amount}%`
                          : formatCurrency(currency, Number(method.charge_amount))
                        : null;
                    const hasMeta =
                      method.min_amount != null ||
                      method.max_amount != null ||
                      chargeLabel != null ||
                      method.duration != null;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedId(method.id)}
                        disabled={busy}
                        className={`flex flex-col gap-3 rounded-xl border p-4 text-left transition hover:shadow-md ${active ? "border-transparent" : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"}`}
                        style={
                          active
                            ? {
                                boxShadow: `0 0 0 2px ${brand}`,
                                background: `${brand}14`,
                              }
                            : undefined
                        }
                      >
                        <span className="flex w-full items-center gap-3">
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
                            style={{ background: brand }}
                          >
                            <i className="fa-solid fa-landmark text-base" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                              {method.label}
                            </span>
                            <span className="block truncate text-xs text-gray-500">
                              {method.kind}
                            </span>
                          </span>
                          <span
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-transparent text-white" : "border-gray-300 dark:border-gray-600"}`}
                            style={active ? { background: brand } : undefined}
                          >
                            {active && (
                              <i className="fa-solid fa-check text-xs" />
                            )}
                          </span>
                        </span>
                        {hasMeta && (
                          <span className="grid w-full grid-cols-2 gap-x-3 gap-y-1.5 border-t border-gray-200/70 pt-3 text-xs dark:border-gray-700/60">
                            {method.min_amount != null && (
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">Minimum</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-200">
                                  {formatCurrency(currency, Number(method.min_amount))}
                                </span>
                              </span>
                            )}
                            {method.max_amount != null && (
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">Maximum</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-200">
                                  {formatCurrency(currency, Number(method.max_amount))}
                                </span>
                              </span>
                            )}
                            {chargeLabel != null && (
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">Charge</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-200">
                                  {chargeLabel}
                                </span>
                              </span>
                            )}
                            {method.duration != null && (
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">ETA</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-200">
                                  {method.duration}
                                </span>
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {editableFields.length > 0 && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                    <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Your details
                    </div>
                    <CustomFieldsEditor
                      defs={editableFields}
                      values={custom}
                      onChange={(id, value) =>
                        setCustom((prev) => ({ ...prev, [id]: value }))
                      }
                      upload={uploadFile}
                      accent={brand}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {DESTINATIONS.map((dest) => {
                    const active = kind === dest.value;
                    return (
                      <button
                        key={dest.value}
                        type="button"
                        onClick={() => setKind(dest.value)}
                        disabled={busy}
                        className={`flex items-center gap-3 rounded-xl border p-4 text-left transition hover:shadow-md ${active ? "border-transparent" : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"}`}
                        style={
                          active
                            ? {
                                boxShadow: `0 0 0 2px ${brand}`,
                                background: `${brand}14`,
                              }
                            : undefined
                        }
                      >
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
                          style={{ background: brand }}
                        >
                          <i className={`${dest.icon} text-base`} />
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {dest.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {kind === "crypto" ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Network
                      </span>
                      <input
                        value={network}
                        onChange={(e) => setNetwork(e.target.value)}
                        disabled={busy}
                        placeholder="e.g. TRC20, ERC20, BEP20"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Coin
                      </span>
                      <input
                        value={coin}
                        onChange={(e) => setCoin(e.target.value)}
                        disabled={busy}
                        placeholder="e.g. USDT, BTC, ETH"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Wallet address
                      </span>
                      <input
                        value={wallet}
                        onChange={(e) => setWallet(e.target.value)}
                        disabled={busy}
                        placeholder="Your wallet address"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Memo / Tag (optional)
                      </span>
                      <input
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        disabled={busy}
                        placeholder="Only if your coin needs it (XRP, XLM, BNB…)"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      Destination details
                    </label>
                    <input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      disabled={busy}
                      placeholder={
                        DESTINATIONS.find((d) => d.value === kind)?.placeholder
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </>
            )}

            <div className="mt-6 rounded-xl border border-gray-200/70 bg-gray-50 p-5 dark:border-gray-700/50 dark:bg-gray-800/60">
              <label
                htmlFor="amount"
                className="mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Withdrawal Amount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-lg font-bold text-gray-500 dark:text-gray-400">
                  {currency}
                </span>
                <input
                  id="amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                  disabled={busy}
                  placeholder="0.00"
                  className="block w-full rounded-xl border-2 bg-white py-4 pl-16 pr-4 text-2xl font-bold text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-900 dark:text-white"
                  style={{ borderColor: `${brand}55` }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(String(value))}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    {currency}
                    {value.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="wd-pin"
                className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Transaction PIN
              </label>
              <input
                id="wd-pin"
                type="password"
                inputMode="numeric"
                value={pin}
                disabled={busy}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="••••"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                style={{ "--tw-ring-color": brand } as React.CSSProperties}
              />
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01] disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.25))`,
                }}
              >
                {busy && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {busy ? "Submitting…" : "Request withdrawal"}
              </button>
              <Link
                href="/dashboard"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:flex-none"
              >
                Back to Dashboard
              </Link>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <i className="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Withdrawal submitted
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              {"It's now in the review queue. You'll get an email once it's been processed."}
            </p>
            <button
              onClick={() => {
                setStep("form");
                setAmount("");
                setDestination("");
                setPin("");
                setCode("");
                setWithdrawalId(null);
                setError(null);
                setCustom({});
              }}
              className="mt-6 inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.25))`,
              }}
            >
              Start another withdrawal
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
        <i
          className="fa-solid fa-shield-halved mt-0.5 shrink-0 text-base"
          style={{ color: brand }}
        />
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Protected by a confirmation code
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {"Every withdrawal is confirmed with a one-time code from our team, so funds can only leave once it's entered."}
          </p>
        </div>
      </div>

      {withdrawals.length > 0 && (
        <div translate="no" className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Your withdrawals
          </h2>
          <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-gray-700/50 dark:bg-gray-800">
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {withdrawals.map((withdrawal) => (
                <li key={withdrawal.id} className="space-y-2 px-4 py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(withdrawal.currency, Number(withdrawal.amount))}
                      </div>
                      <div className="text-xs text-gray-500">
                        {withdrawal.destination?.kind?.toUpperCase() ?? "--"} {" · "}
                        {new Date(withdrawal.created_at).toLocaleString()}
                      </div>
                      {withdrawal.admin_note && (
                        <div className="mt-1 text-xs italic text-gray-500">
                          {"“"}
                          {withdrawal.admin_note}
                          {"”"}
                        </div>
                      )}
                    </div>
                    <WithdrawalBadge
                      status={withdrawal.status}
                      verified={!!withdrawal.otp_verified_at}
                    />
                  </div>
                  {withdrawal.status === "pending" && !withdrawal.otp_verified_at && (
                    <button
                      onClick={() => {
                        setCode("");
                        setError(null);
                        setWithdrawalId(String(withdrawal.id));
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow"
                      style={{ background: brand }}
                    >
                      Enter confirmation code
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {withdrawalId != null && step !== "done" && (
        <div
          translate="no"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div
            className="absolute inset-0"
            onClick={() => {
              setWithdrawalId(null);
              setError(null);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-gray-900">
            <div
              className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full"
              style={{ background: `${brand}22` }}
            >
              <i className="fa-solid fa-headset text-2xl" style={{ color: brand }} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Enter confirmation code
            </h3>
            <p className="mb-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              {"Our team will give you a 6-digit code to confirm this withdrawal. Enter it below to finish."}
            </p>
            <input
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="------"
              autoFocus
              inputMode="numeric"
              disabled={busy}
              className="block w-full rounded-xl border-2 bg-white py-4 text-center text-3xl font-bold tracking-[0.3em] sm:tracking-[0.5em] text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-900 dark:text-white"
              style={{ borderColor: `${brand}55` }}
            />
            <Link
              href="/support"
              className="mt-3 inline-block text-xs font-medium underline underline-offset-2"
              style={{ color: brand }}
            >
              {"Don't have your code yet? Contact support"}
            </Link>
            {error && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setWithdrawalId(null);
                  setError(null);
                }}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Enter later
              </button>
              <button
                type="button"
                onClick={() => void handleVerify()}
                disabled={busy || code.length !== 6}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.25))`,
                }}
              >
                {busy && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {busy ? "Confirming…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  approved: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  processing: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  sent: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
};

function WithdrawalBadge({
  status,
  verified,
}: {
  status: string;
  verified: boolean;
}) {
  if (!verified) {
    return (
      <span className="shrink-0 rounded-md bg-gray-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
        awaiting code
      </span>
    );
  }
  return (
    <span
      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASSES[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}