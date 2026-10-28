"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/lib/next/link";
import { toast } from "sonner";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { bankFetch } from "@/lib/api";
import {
  currencySymbol,
  formatCurrency,
  parseNumeric,
  sanitizeAmount,
} from "@/lib/format";
import {
  CustomFieldsEditor,
  missingFieldLabel,
  uploadFile,
  type CustomField,
} from "@/components/dashboard/custom-fields";

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

const METHOD_LABELS: Record<string, string> = {
  "bank-mock": "Bank transfer",
  "card-mock": "Card",
  bank: "Bank transfer",
  card: "Card",
  crypto: "Crypto transfer",
  bitcoin: "Bitcoin",
  usdt: "USDT",
};

interface DepositRecord {
  id: number | string;
  currency: string;
  amount: string | number;
  method?: string;
  created_at: string;
  status: string;
  admin_note?: string | null;
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
  instructions?: string | null;
  custom_fields?: CustomField[];
}

interface DepositMethod {
  id: number | string;
  name: string;
  type: string;
  emoji?: string;
  min: number | null;
  max: number | null;
  charge: number | null;
  chargeType?: string;
  duration?: string;
  instructions?: string | null;
  details: { label: string; value: string; isFile: boolean }[];
  inputFields: CustomField[];
}

interface Message {
  kind: "ok" | "err";
  text: string;
}

export default function DepositPage() {
  return (
    <AppShell>
      <DepositFlow />
    </AppShell>
  );
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapMethod(raw: RawMethod): DepositMethod {
  const details: { label: string; value: string; isFile: boolean }[] = [];
  const inputFields: CustomField[] = [];
  for (const field of raw.custom_fields ?? []) {
    if (field.role === "input") {
      inputFields.push(field);
      continue;
    }
    const value = (field.value ?? "").trim();
    if (value) {
      details.push({ label: field.label, value, isFile: field.type === "file" });
    }
  }
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    emoji: raw.emoji,
    instructions: raw.instructions ?? null,
    min: toNumberOrNull(raw.minimum),
    max: toNumberOrNull(raw.maximum),
    charge: toNumberOrNull(raw.charges_amount),
    chargeType: raw.charges_type,
    duration: raw.duration,
    details,
    inputFields,
  };
}

/** A deposit method that has guidance text but no payment details to copy —
 *  e.g. PayPal and Cash Deposit, which require contacting support. */
function isContactSupport(method: DepositMethod | null): boolean {
  if (!method) return false;
  return method.details.length === 0 && !!method.instructions?.trim();
}

function methodLabel(value?: string | null): string {
  const key = (value ?? "").trim();
  return key ? (METHOD_LABELS[key.toLowerCase()] ?? key) : "—";
}

function DepositFlow() {
  const { site } = useMe();
  const currency = site.primary_currency;

  const [step, setStep] = useState("select");
  const [methods, setMethods] = useState<DepositMethod[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [amount, setAmount] = useState("");
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [proofUrl, setProofUrl] = useState("");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Message | null>(null);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);

  async function loadDeposits() {
    const res = await bankFetch<{ deposits: DepositRecord[] }>("/deposits");
    if (res.ok && res.data?.deposits) {
      setDeposits(res.data.deposits);
    }
  }

  useEffect(() => {
    loadDeposits();
    (async () => {
      const res = await bankFetch<{ methods: RawMethod[] }>(
        "/payment-methods?for=deposit",
      );
      setMethods(
        res.ok && res.data?.methods ? res.data.methods.map(mapMethod) : [],
      );
    })();
  }, []);

  useEffect(() => {
    if (methods && methods.length > 0 && !methods.some((m) => m.id === selectedId)) {
      setSelectedId(methods[0].id);
    }
  }, [methods, selectedId]);

  useEffect(() => {
    setCustom({});
  }, [selectedId]);

  const selected = methods?.find((m) => m.id === selectedId) ?? null;
  const amountNum = parseNumeric(amount);
  const validation =
    selected
      ? amountNum
        ? selected.min != null && amountNum < selected.min
          ? `The minimum for ${selected.name} is ${formatCurrency(currency, selected.min)}.`
          : selected.max != null && selected.max > 0 && amountNum > selected.max
            ? `The maximum for ${selected.name} is ${formatCurrency(currency, selected.max)}.`
            : null
        : null
      : null;
  const missingLabel = selected ? missingFieldLabel(selected.inputFields, custom) : null;

  async function submitPayment() {
    if (!selected) return;
    if (validation) {
      toast.error(validation);
      return;
    }
    if (missingLabel) {
      toast.error(`Please fill in "${missingLabel}".`);
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await bankFetch("/deposit", {
      method: "POST",
      body: {
        amount: amountNum,
        method_id: selected.id,
        custom: selected.inputFields.length ? custom : undefined,
        ...(proofUrl.trim() ? { proof_url: proofUrl.trim() } : {}),
        ref,
      },
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(
        res.errorCode === "below_minimum"
          ? `That amount is below the minimum for ${selected.name}.`
          : res.errorCode === "above_maximum"
            ? `That amount is above the maximum for ${selected.name}.`
            : res.errorCode === "method_not_found"
              ? "That payment method is no longer available — please pick another."
              : (res.error ?? "Failed"),
      );
      return;
    }
    setStep("done");
    loadDeposits();
  }

  return (
    <div className="-mx-4 -my-5 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 lg:-mx-6 lg:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 hidden lg:block">
          <div className="flex items-center justify-between">
            <div className="mb-2 flex items-center gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-xl text-white"
                style={{ background: "var(--brand)" }}
              >
                <i className="fas fa-piggy-bank text-lg" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Deposit Funds
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Add money to your account securely
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-300"
            >
              <i className="fas fa-arrow-left mr-2" />
              {" Back to Dashboard"}
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95">
          <div
            className="p-6 text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--brand), rgba(0,0,0,0.4))",
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-xl bg-white/20 p-4 backdrop-blur-sm">
                <i className="fas fa-piggy-bank text-3xl" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">
                {step === "pay" ? "Complete Your Payment" : "Fund Your Account"}
              </h2>
              <p className="text-sm text-white/90">
                {step === "pay"
                  ? `Send ${formatCurrency(currency, amountNum)} using the details below`
                  : "Choose your preferred deposit method and amount"}
              </p>
            </div>
          </div>

          {step === "select" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setMsg(null);
                if (!selected) {
                  toast.error("Choose a payment method");
                  return;
                }
                if (!amount || amountNum <= 0) {
                  toast.error("Enter an amount");
                  return;
                }
                if (validation) {
                  toast.error(validation);
                  return;
                }
                setRef(`DEP-${Date.now().toString(36).toUpperCase()}`);
                setStep("pay");
              }}
              className="p-6"
            >
              <label className="mb-4 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Select Deposit Method
              </label>
              {methods === null ? (
                <div className="rounded-xl border border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Loading payment methods…
                </div>
              ) : methods.length === 0 ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
                  <i className="fas fa-circle-info mr-2" />
                  {"No deposit method has been set up yet. Please contact support before sending any payment."}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {methods.map((method) => {
                    const selectedMethod = selectedId === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedId(method.id)}
                        disabled={busy}
                        className={`cursor-pointer rounded-xl border p-4 text-left transition hover:shadow-md ${selectedMethod ? "border-transparent ring-2" : "border-gray-200 bg-white/80 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/80"}`}
                        style={
                          selectedMethod
                            ? {
                                "--tw-ring-color": "var(--brand)",
                                background:
                                  "color-mix(in srgb, var(--brand) 8%, transparent)",
                              } as React.CSSProperties
                            : undefined
                        }
                      >
                        <div className="flex items-center">
                          <div className="mr-3 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-lg dark:bg-gray-700">
                            {method.emoji || "🏦"}
                          </div>
                          <div className="min-w-0 flex-grow">
                            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {method.name}
                            </h3>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {method.type}
                            </p>
                          </div>
                          <div
                            className={`ml-2 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selectedMethod ? "border-transparent text-white" : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"}`}
                            style={selectedMethod ? { background: "var(--brand)" } : undefined}
                          >
                            {selectedMethod && (
                              <i className="fas fa-check text-[10px]" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selected && (
                <MethodInfo method={selected} cur={currency} amount={amountNum} />
              )}

              {selected && isContactSupport(selected) ? (
                <div className="mt-6 rounded-2xl border border-amber-300/70 bg-amber-50 p-5 shadow-sm dark:border-amber-700/50 dark:bg-amber-900/20">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-headset mt-0.5 text-xl text-amber-600 dark:text-amber-400" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Contact support to use {selected.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-amber-800 dark:text-amber-200">
                        Please message the support team if you want to deposit
                        money using this payment method.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href="/support"
                          className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
                          style={{ background: "var(--brand)" }}
                        >
                          <i className="fas fa-comment-dots mr-2" />
                          Message Support
                        </Link>
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white/70 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-300"
                        >
                          <i className="fas fa-arrow-left mr-2" />
                          Back to Dashboard
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-6 rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-50/80 to-white/80 p-5 shadow-sm dark:border-gray-700/50 dark:from-gray-800/80 dark:to-gray-700/80">
                    <label
                      htmlFor="amount"
                      className="mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Deposit Amount
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4 text-lg font-bold text-gray-500 dark:text-gray-400">
                        {currencySymbol(currency)}
                      </span>
                      <input
                        id="amount"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                        disabled={busy}
                        placeholder="0.00"
                        className="relative block w-full rounded-xl border-2 bg-white/90 py-4 pl-12 pr-12 text-2xl font-bold text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-800/90 dark:text-white"
                        style={{
                          borderColor:
                            "color-mix(in srgb, var(--brand) 35%, transparent)",
                        }}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-lg font-bold text-gray-400 dark:text-gray-500">
                        .00
                      </span>
                    </div>
                    {validation ? (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {validation}
                      </p>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {QUICK_AMOUNTS.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setAmount(String(value))}
                            className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                          >
                            {formatCurrency(currency, value)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg && (
                    <p
                      className={`mt-4 text-sm ${msg.kind === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {msg.text}
                    </p>
                  )}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={busy || !amount || !selected || !!validation}
                      className="inline-flex flex-1 items-center justify-center rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60"
                      style={{ background: "var(--brand)" }}
                    >
                      <i className="fas fa-arrow-right mr-2" />
                      {" Continue to Deposit"}
                    </button>
                    <Link
                      href="/dashboard"
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white/70 px-6 py-3 font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-300 sm:flex-none"
                    >
                      <i className="fas fa-arrow-left mr-2" />
                      {" Back to Dashboard"}
                    </Link>
                  </div>
                </>
              )}
            </form>
          )}

          {step === "pay" && selected && (
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between rounded-xl border border-gray-200/70 bg-gray-50 p-4 dark:border-gray-700/50 dark:bg-gray-800/60">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 text-lg dark:bg-gray-700">
                    {selected.emoji || "🏦"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selected.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {"Reference: "}
                      <span className="font-mono">{ref}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Amount</div>
                  <div className="text-lg font-extrabold text-gray-900 dark:text-white">
                    {formatCurrency(currency, amountNum)}
                  </div>
                </div>
              </div>

              {selected.details.length > 0 ? (
                <div className="rounded-xl border border-gray-200/70 bg-white p-5 dark:border-gray-700/50 dark:bg-gray-900/40">
                  <h3 className="mb-3 flex items-center text-sm font-semibold text-gray-900 dark:text-white">
                    <i
                      className="fas fa-building-columns mr-2"
                      style={{ color: "var(--brand)" }}
                    />
                    {" Send your payment to"}
                  </h3>
                  <div className="space-y-2">
                    {selected.details.map((detail) => (
                      <DetailRow
                        key={detail.label}
                        label={detail.label}
                        value={detail.value}
                        isFile={detail.isFile}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <WarningBox
                  text={`No payment details have been set up for ${selected.name} yet. Please contact support before sending any payment.`}
                />
              )}

              {selected.instructions && (
                <div className="mt-4 rounded-xl border border-gray-200/70 bg-gray-50 p-4 dark:border-gray-700/60 dark:bg-gray-800/60">
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Instructions</h4>
                  <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{selected.instructions}</p>
                </div>
              )}

              {selected.inputFields.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Your details
                  </div>
                  <CustomFieldsEditor
                    defs={selected.inputFields}
                    values={custom}
                    onChange={(id, value) =>
                      setCustom((prev) => ({ ...prev, [id]: value }))
                    }
                    upload={uploadFile}
                  />
                </div>
              )}

              <div className="mt-5">
                <ProofUploader value={proofUrl} onChange={setProofUrl} busy={busy} />
              </div>

              {msg && (
                <p
                  className={`mt-4 text-sm ${msg.kind === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {msg.text}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={submitPayment}
                  disabled={busy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60"
                  style={{ background: "var(--brand)" }}
                >
                  {busy ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <i className="fas fa-check" />
                  )}
                  {" I've Made the Payment"}
                </button>
                <button
                  onClick={() => setStep("select")}
                  disabled={busy}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 sm:flex-none"
                >
                  <i className="fas fa-arrow-left mr-2" />
                  {" Back"}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-green-100 dark:bg-green-900/40">
                <i className="fas fa-check text-2xl text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Deposit submitted
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                {"We've received your deposit request. You'll be emailed once it's approved."}
              </p>
              <button
                onClick={() => {
                  setStep("select");
                  setAmount("");
                  setProofUrl("");
                  setRef("");
                  setCustom({});
                  setMsg(null);
                }}
                className="mt-6 inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105"
                style={{ background: "var(--brand)" }}
              >
                Make another deposit
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-gray-200/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/80">
          <div className="flex items-start gap-3">
            <i className="fas fa-shield-alt mt-0.5" style={{ color: "var(--brand)" }} />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Secure Deposit
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {"All deposits are processed through secure payment channels. Your financial information is never stored on our servers."}
              </p>
            </div>
          </div>
        </div>

        {deposits.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Your deposits
            </h2>
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/80">
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {deposits.map((deposit) => (
                  <li
                    key={deposit.id}
                    className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(deposit.currency, Number(deposit.amount))}
                      </div>
                      <div className="text-xs text-gray-500">
                        {methodLabel(deposit.method)} {" · "}
                        {new Date(deposit.created_at).toLocaleString()}
                      </div>
                      {deposit.admin_note && (
                        <div className="mt-1 text-xs italic text-gray-500">
                          {"“"}
                          {deposit.admin_note}
                          {"”"}
                        </div>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${deposit.status === "approved" ? "bg-green-500/15 text-green-700 dark:text-green-300" : deposit.status === "rejected" ? "bg-red-500/15 text-red-700 dark:text-red-300" : "bg-amber-500/15 text-amber-600 dark:text-amber-300"}`}
                    >
                      {deposit.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MethodInfo({
  method,
  cur,
  amount,
}: {
  method: DepositMethod;
  cur: string;
  amount: number;
}) {
  const chips: string[] = [];
  if (method.min != null) chips.push(`Min ${formatCurrency(cur, method.min)}`);
  if (method.max != null && method.max > 0) {
    chips.push(`Max ${formatCurrency(cur, method.max)}`);
  }
  if (method.charge != null && method.chargeType) {
    chips.push(
      `Fee ${
        method.chargeType === "percent"
          ? `${method.charge}%`
          : formatCurrency(cur, method.charge)
      }`,
    );
  }
  if (method.duration) chips.push(`ETA ${method.duration}`);
  if (!chips.length) return null;
  const credit =
    method.charge != null && method.chargeType
      ? method.chargeType === "percent"
        ? (amount * method.charge) / 100
        : method.charge
      : null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
      {chips.map((chip) => (
        <span key={chip}>{chip}</span>
      ))}
      {credit != null && credit > 0 && amount > 0 && (
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {"You’ll be credited about "}
          {formatCurrency(cur, amount - credit)}
        </span>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  isFile,
}: {
  label: string;
  value: string;
  isFile: boolean;
}) {
  if (isFile) {
    return (
      <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
        <div className="mb-1 text-xs text-gray-500">{label}</div>
        <img
          src={value}
          alt={label}
          className="h-32 w-32 rounded-lg border border-gray-200 bg-white object-contain dark:border-gray-700"
        />
      </div>
    );
  }
  const masked = value.includes("****");
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="flex items-center gap-2">
        <span className="break-all font-mono text-xs font-semibold text-gray-900 dark:text-white">
          {value}
        </span>
        {masked ? (
          <span className="text-gray-400" title="Hidden by the bank">
            <i className="fas fa-lock text-xs" />
          </span>
        ) : (
          <button
            onClick={() => {
              navigator.clipboard.writeText(value);
            }}
            className="text-gray-400 transition hover:opacity-70"
            aria-label={`Copy ${label}`}
          >
            <i className="fas fa-copy text-xs" />
          </button>
        )}
      </span>
    </div>
  );
}

function ProofUploader({
  value,
  onChange,
  busy,
}: {
  value: string;
  onChange: (value: string) => void;
  busy: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file?: File) {
    if (!file) return;
    setError(null);
    if (!(file.type.startsWith("image/") || file.type === "application/pdf")) {
      setError("Only an image or PDF file is allowed.");
      return;
    }
    if (file.size > 8388608) {
      setError("That file is too large (max 8MB).");
      return;
    }
    setUploading(true);
    const url = await uploadFile(file);
    setUploading(false);
    if (!url) {
      setError("Upload failed — please try again.");
      return;
    }
    onChange(url);
    setFileName(file.name);
  }

  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Payment proof (optional)
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border-2 border-green-500/40 bg-green-500/5 p-4">
          <i className="fas fa-check text-green-600" />
          <div className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">
            {fileName || "Uploaded file"}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setFileName("");
              fileRef.current?.click();
            }}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            fileRef.current?.click();
          }}
          disabled={busy || uploading}
          className="w-full rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-gray-400 disabled:opacity-60 dark:border-gray-600"
        >
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {uploading ? "Uploading…" : "Tap to upload your payment proof"}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {"A screenshot or PDF of your transaction — up to 8MB. It helps us approve faster."}
          </div>
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function WarningBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-amber-200/60 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
      <i className="fas fa-circle-info mr-2" /> {text}
    </div>
  );
}