"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/lib/next/link";
import { toast } from "sonner";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { KycGate } from "@/components/dashboard/kyc-gate";
import { bankFetch } from "@/lib/api";
import { currencySymbol, formatCurrency, parseNumeric, sanitizeAmount } from "@/lib/format";

const TAB_LABELS: Record<string, string> = {
  local: "local",
  international: "international",
  member: "To a member",
};

const METHODS = [
  {
    key: "Wire Transfer",
    icon: "fa-solid fa-building-columns",
    wrap: "bg-blue-100 dark:bg-blue-900/30",
    color: "text-blue-600 dark:text-blue-400",
    desc: "Transfer funds directly to international bank accounts.",
    detail: "Account number / IBAN",
    bank: true,
  },
  {
    key: "Cryptocurrency",
    icon: "fa-brands fa-bitcoin",
    wrap: "bg-amber-100 dark:bg-amber-900/30",
    color: "text-amber-600 dark:text-amber-400",
    desc: "Send funds to your cryptocurrency wallet.",
    detail: "Wallet address",
  },
  {
    key: "Digital Wallet",
    icon: "fa-solid fa-wallet",
    wrap: "bg-indigo-100 dark:bg-indigo-900/30",
    color: "text-indigo-600 dark:text-indigo-400",
    desc: "Transfer funds to your digital wallet.",
    detail: "Wallet email",
  },
  {
    key: "International Transfer",
    icon: "fa-solid fa-money-bill-transfer",
    wrap: "bg-green-100 dark:bg-green-900/30",
    color: "text-green-600 dark:text-green-400",
    desc: "Transfer internationally with low fees.",
    detail: "Recipient email",
  },
  {
    key: "Mobile Wallet",
    icon: "fa-solid fa-dollar-sign",
    wrap: "bg-pink-100 dark:bg-pink-900/30",
    color: "text-pink-600 dark:text-pink-400",
    desc: "Quick transfers to your mobile wallet.",
    detail: "Wallet handle",
  },
  {
    key: "More Options",
    icon: "fa-solid fa-ellipsis",
    wrap: "bg-amber-100 dark:bg-amber-900/30",
    color: "text-amber-600 dark:text-amber-400",
    desc: "Other digital wallets and transfers.",
    detail: "Recipient handle / account",
    more: true,
  },
];

interface Beneficiary {
  id: number | string;
  name: string;
  account_number?: string;
  bank_name?: string;
  swift?: string;
  favorite?: boolean;
}

interface BalanceItem {
  currency: string;
  amount: string | number;
  /** Spendable balance: total minus money reserved by pending requests. */
  available?: string | number;
  reserved?: string | number;
}

interface TransferConfig {
  transfer_charges?: string | number;
  min_transfer?: string | number;
  max_transfer?: string | number;
}

interface TransferResponse {
  fee?: string | number;
  ref?: string;
  transfer_id?: string | number;
}

interface VerifyResponse {
  balance_after?: string | number;
}

interface Receipt {
  ref: string;
  recipient: string;
  method: string;
  amount: number;
  fee: number;
  total: number;
  description: string;
  scope: string;
  date: Date;
}

interface Message {
  kind: "ok" | "err";
  text: string;
}

export default function TransferPage() {
  return (
    <AppShell>
      <KycGate action="transfer money">
        <TransferFlow />
      </KycGate>
    </AppShell>
  );
}

function TransferFlow() {
  const { site } = useMe();
  const currency = site.primary_currency;

  const [tab, setTab] = useState("local");
  const [step, setStep] = useState("form");
  const [balance, setBalance] = useState(0);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [method, setMethod] = useState("");
  const [transferCharges, setTransferCharges] = useState(0);
  const [minTransfer, setMinTransfer] = useState(0);
  const [maxTransfer, setMaxTransfer] = useState(0);
  const [amount, setAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("Account");
  const [routing, setRouting] = useState("");
  const [swift, setSwift] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<number | string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<Message | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [pendingTransferId, setPendingTransferId] = useState<number | string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");

  const brandColor = site.brand_color || "#0ea5e9";

  function selectBeneficiary(b: Beneficiary) {
    setAccountName(b.name);
    setAccountNumber(b.account_number ?? "");
    setBankName(b.bank_name ?? "");
    setSwift(b.swift ?? "");
    setDescription(`Transfer to ${b.name}`);
    setSelectedBeneficiaryId(b.id);
  }

  useEffect(() => {
    if (window.location.hash === "#international") setTab("international");
    if (typeof navigator !== "undefined") {
      setCanShare(typeof navigator.share === "function");
    }
    (async () => {
      const [balanceRes, benRes, configRes] = await Promise.all([
        bankFetch<{ balances: BalanceItem[] }>("/balance"),
        bankFetch<{ beneficiaries: Beneficiary[] }>("/beneficiaries"),
        bankFetch<TransferConfig>("/transfer-config"),
      ]);
      if (balanceRes.ok && balanceRes.data?.balances) {
        const found =
          balanceRes.data.balances.find((b) => b.currency === currency) ??
          balanceRes.data.balances[0];
        // Spend against the available balance so pending requests are excluded.
        setBalance(Number(found?.available ?? found?.amount ?? 0));
      }
      if (benRes.ok && benRes.data?.beneficiaries) {
        setBeneficiaries(benRes.data.beneficiaries);
        const to = new URLSearchParams(window.location.search).get("to");
        if (to) {
          const found = benRes.data.beneficiaries.find((b) => b.account_number === to);
          if (found) selectBeneficiary(found);
          else setAccountNumber(to);
        }
      }
      if (configRes.ok && configRes.data) {
        setTransferCharges(Number(configRes.data.transfer_charges ?? 0));
        setMinTransfer(Number(configRes.data.min_transfer ?? 0));
        setMaxTransfer(Number(configRes.data.max_transfer ?? 0));
      }
    })();
  }, [currency]);

  const selectedMethod = METHODS.find((m) => m.key === method);
  const isBankMethod = tab === "local" || Boolean(selectedMethod?.bank);
  const amountNum = parseNumeric(amount);
  const fee = amountNum > 0 ? (amountNum * transferCharges) / 100 : 0;
  const total = amountNum + fee;
  const quickAmounts = [100, 500, 1000].filter(
    (v) => (minTransfer <= 0 || v >= minTransfer) && (maxTransfer <= 0 || v <= maxTransfer),
  );
  const maxAmount = maxTransfer > 0 ? Math.min(balance, maxTransfer) : balance;
  const maxAmountRounded = maxAmount > 0 ? Math.floor(100 * maxAmount) / 100 : 0;

  async function handleExternalTransfer() {
    setSubmitting(true);
    setMsg(null);
    const recipient = accountName.trim() || accountNumber.trim();
    const methodLabel = tab === "international" ? method : "Local bank transfer";
    const res = await bankFetch<TransferResponse>("/transfer/external", {
      method: "POST",
      body: {
        scope: tab,
        method: tab === "international" ? method : "Local Transfer",
        beneficiary_name: recipient,
        account_number: accountNumber.trim(),
        bank_name: isBankMethod ? bankName.trim() : method,
        account_type: accountType,
        ...(tab === "international" && isBankMethod ? { swift: swift.trim() } : {}),
        ...(tab === "local" ? { routing: routing.trim() || undefined } : {}),
        amount: amountNum,
        ...(description.trim() ? { narration: description.trim() } : {}),
        ...(pin ? { pin } : {}),
        save_beneficiary: saveBeneficiary,
        ...(selectedBeneficiaryId ? { beneficiary_id: selectedBeneficiaryId } : {}),
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      let message = res.error ?? "Transfer failed.";
      if (res.errorCode === "below_minimum") {
        const min = Number(res.errorBody?.min_transfer ?? minTransfer);
        message = `Minimum transfer is ${formatCurrency(currency, min)}.`;
      } else if (res.errorCode === "above_maximum") {
        const max = Number(res.errorBody?.max_transfer ?? maxTransfer);
        message = `Maximum transfer is ${formatCurrency(currency, max)}.`;
      } else if (
        res.errorCode === "insufficient_funds" ||
        res.errorCode === "insufficient_balance"
      ) {
        message = "Not enough balance to cover the amount and fee.";
      }
      setStep("form");
      setMsg({ kind: "err", text: message });
      return;
    }
    const feePaid = Number(res.data?.fee ?? fee);
    setReceipt({
      ref: res.data?.ref ?? "",
      recipient: recipient || "Recipient",
      method: methodLabel,
      amount: amountNum,
      fee: feePaid,
      total: amountNum + feePaid,
      description: description.trim(),
      scope: tab,
      date: new Date(),
    });
    if (res.data?.transfer_id) {
      setVerifyCode("");
      setPendingTransferId(res.data.transfer_id);
    } else {
      setStep("done");
    }
  }

  async function handleMemberTransfer() {
    setSubmitting(true);
    setMsg(null);
    const res = await bankFetch<TransferResponse>("/transfer", {
      method: "POST",
      body: {
        recipient_email: recipientEmail.trim(),
        amount: amountNum,
        pin,
        currency,
        ...(description.trim() ? { narration: description.trim() } : {}),
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      let message: string;
      if (res.errorCode === "recipient_not_found") {
        message = "No member found with that email.";
      } else if (res.errorCode === "cannot_transfer_to_self") {
        message = "You can't transfer to yourself.";
      } else if (res.errorCode === "below_minimum") {
        const min = Number(res.errorBody?.min_transfer ?? minTransfer);
        message = `Minimum transfer is ${fmt(min)}.`;
      } else if (res.errorCode === "above_maximum") {
        const max = Number(res.errorBody?.max_transfer ?? maxTransfer);
        message = `Maximum transfer is ${fmt(max)}.`;
      } else if (
        res.errorCode === "insufficient_funds" ||
        res.errorCode === "insufficient_balance"
      ) {
        message = "Amount plus fee exceeds your balance.";
      } else if (res.errorCode === "bad_pin") {
        message = "Incorrect PIN.";
      } else if (res.errorCode === "pin_not_set") {
        message = "You must set a transaction PIN before sending money.";
      } else if (res.errorCode === "invalid_input") {
        message = "Please check your input and try again.";
      } else {
        message = res.error ?? "Transfer failed.";
      }
      setStep("form");
      setMsg({ kind: "err", text: message });
      return;
    }
    const feePaid = Number(res.data?.fee ?? fee);
    setReceipt({
      ref: res.data?.ref ?? "",
      recipient: recipientEmail.trim(),
      method: "Member transfer",
      amount: amountNum,
      fee: feePaid,
      total: amountNum + feePaid,
      description: description.trim(),
      scope: "member",
      date: new Date(),
    });
    if (res.data?.transfer_id) {
      setVerifyCode("");
      setPendingTransferId(res.data.transfer_id);
    } else {
      setStep("done");
    }
  }

  async function handleVerify() {
    if (pendingTransferId == null || verifyCode.length !== 6) return;
    setSubmitting(true);
    setMsg(null);
    const res = await bankFetch<VerifyResponse>("/transfer/verify", {
      method: "POST",
      body: { transfer_id: pendingTransferId, code: verifyCode },
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(
        res.errorCode === "invalid_code"
          ? "Wrong or expired code -- check with our team."
          : (res.error ?? "Could not confirm the transfer."),
      );
      return;
    }
    if (res.data?.balance_after != null) {
      setBalance(Number(res.data.balance_after));
    }
    setPendingTransferId(null);
    setVerifyCode("");
    setStep("done");
  }

  async function handleShare() {
    if (!receipt) return;
    const text = `Transfer of ${formatCurrency(currency, receipt.amount)} to ${receipt.recipient} completed.
Fee: ${formatCurrency(currency, receipt.fee)}
Total: ${formatCurrency(currency, receipt.total)}
Reference: ${receipt.ref}
Date: ${receipt.date.toLocaleString()}`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Transfer Receipt", text });
      } catch {
        // Dismissed or failed share -- ignore.
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setMsg({ kind: "ok", text: "Receipt copied to clipboard." });
      } catch {
        // Clipboard unavailable -- ignore.
      }
    }
  }

  const fmt = (value: number) => formatCurrency(currency, value);
  const inputClass =
    "block w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
  const labelClass = "mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300";

  return (
    <div className="-mx-4 -my-5 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 lg:-mx-6 lg:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 hidden lg:block">
          <div className="mb-2 flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl text-white"
              style={{ background: "var(--brand)" }}
            >
              <i className="fas fa-paper-plane text-lg" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {tab === "international"
                ? "International Transfer"
                : tab === "member"
                  ? "Member Transfer"
                  : "Local Transfer"}
            </h1>
          </div>
          <p className="ml-13 text-gray-600 dark:text-gray-400">
            {tab === "international"
              ? "Review available international transfer options and fees"
              : tab === "member"
                ? "Send a transfer to another member on this platform"
                : "Send a transfer to a saved local beneficiary"}
          </p>
        </div>

        {step !== "done" && (
          <div className="mb-4 inline-flex rounded-xl border border-gray-200/60 bg-white/80 p-1 text-sm font-medium backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/80">
            {["local", "international", "member"].map((key) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTab(key);
                    setStep("form");
                    setMethod("");
                    setSelectedBeneficiaryId(null);
                  }}
                  className={`rounded-lg px-4 py-1.5 transition ${active ? "text-white" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}
                  style={active ? { background: "var(--brand)" } : undefined}
                >
                  {TAB_LABELS[key]}
                </button>
              );
            })}
          </div>
        )}

        {step === "done" && receipt ? (
          <DoneReceipt
            cur={currency}
            receipt={receipt}
            canShare={canShare}
            onShare={handleShare}
            onView={() => setShowReceipt(true)}
            onReset={() => {
              setAmount("");
              setRecipientEmail("");
              setAccountName("");
              setAccountNumber("");
              setBankName("");
              setRouting("");
              setSwift("");
              setDescription("");
              setPin("");
              setSaveBeneficiary(false);
              setSelectedBeneficiaryId(null);
              setStep("form");
              setMsg(null);
              setMethod("");
              setReceipt(null);
              setShowReceipt(false);
            }}
            msg={msg}
          />
        ) : tab === "member" ? (
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95">
            {step === "form" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setMsg(null);
                  if (!amount || amountNum <= 0) {
                    toast.error("Enter an amount.");
                  } else if (minTransfer > 0 && amountNum < minTransfer) {
                    toast.error(`Minimum transfer is ${fmt(minTransfer)}.`);
                  } else if (maxTransfer > 0 && amountNum > maxTransfer) {
                    toast.error(`Maximum transfer is ${fmt(maxTransfer)}.`);
                  } else if (total > balance) {
                    toast.error("Amount plus fee exceeds your available balance.");
                  } else if (
                    recipientEmail.trim() &&
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())
                  ) {
                    if (pin.length < 4) {
                      toast.error("Enter your transaction PIN.");
                    } else {
                      setStep("review");
                    }
                  } else {
                    toast.error("Enter a valid email address.");
                  }
                }}
                className="space-y-4 p-6"
              >
                <div className="rounded-xl border border-gray-200/70 bg-gray-50 p-4 dark:border-gray-700/50 dark:bg-gray-800/60">
                  <div className="mb-2 flex items-center justify-between">
                    <label className={labelClass}>Amount</label>
                    <span className="text-xs text-gray-500">
                      {"Available: "}
                      {fmt(balance)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-lg font-bold text-gray-500 dark:text-gray-400">
                      {currencySymbol(currency)}
                    </span>
                    <input
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                      placeholder="0.00"
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white py-4 pl-16 pr-4 text-2xl font-bold text-gray-900 outline-none transition focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickAmounts.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAmount(String(v))}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        {fmt(v)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmount(String(maxAmountRounded))}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ background: "var(--brand)" }}
                    >
                      Max
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <span>
                      {"Transfer fee: "}
                      {transferCharges}
                      {"%"}
                      {fee > 0 ? ` (${fmt(fee)})` : ""}
                    </span>
                    {minTransfer > 0 && (
                      <span>
                        {"Minimum: "}
                        {fmt(minTransfer)}
                      </span>
                    )}
                    {maxTransfer > 0 && (
                      <span>
                        {"Maximum: "}
                        {fmt(maxTransfer)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={labelClass}>Recipient email</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="member@example.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    {"Note "}
                    <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this transfer for?"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Transaction PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••"
                    className={inputClass}
                  />
                </div>

                {msg && (
                  <p
                    className={`text-sm ${msg.kind === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {msg.text}
                  </p>
                )}

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01]"
                  style={{ background: "var(--brand)" }}
                >
                  <i className="fas fa-paper-plane" />
                  {" Continue"}
                </button>
              </form>
            ) : (
              <div className="p-6">
                <div className="rounded-xl border border-gray-200/70 bg-gray-50 p-5 dark:border-gray-700/50 dark:bg-gray-800/60">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Review transfer
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <Row k="Method" v="Member transfer" />
                    <Row k="Recipient email" v={recipientEmail.trim()} />
                    {description && <Row k="Note" v={description} />}
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                    <Row k="Amount" v={fmt(amountNum)} />
                    <Row k={`Fee (${transferCharges}%)`} v={fmt(fee)} />
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                    <Row k="Total to debit" v={fmt(total)} strong />
                  </div>
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
                    type="button"
                    onClick={handleMemberTransfer}
                    disabled={submitting}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01] disabled:opacity-60"
                    style={{ background: "var(--brand)" }}
                  >
                    {submitting && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}
                    {" Confirm & Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setMsg(null);
                    }}
                    disabled={submitting}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 sm:flex-none"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : tab !== "international" || method || step !== "form" ? (
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95">
            {tab === "international" && method && step === "form" && (
              <div className="flex items-center gap-2 border-b border-gray-200/50 p-4 dark:border-gray-700/50">
                <button
                  type="button"
                  onClick={() => {
                    setMethod("");
                    setSelectedBeneficiaryId(null);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <i className="fas fa-arrow-left text-xs" />
                </button>
                <div className="flex items-center gap-2">
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-xl ${selectedMethod?.wrap}`}
                  >
                    <i className={`${selectedMethod?.icon} ${selectedMethod?.color} text-sm`} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {method}
                  </span>
                </div>
              </div>
            )}
            {beneficiaries.length > 0 && step === "form" && tab === "local" && (
              <div className="border-b border-gray-200/50 p-4 dark:border-gray-700/50">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Saved beneficiaries
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {beneficiaries.slice(0, 10).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => selectBeneficiary(b)}
                      className="group flex shrink-0 flex-col items-center"
                    >
                      <div
                        className="relative mb-1 grid h-14 w-14 place-items-center rounded-full border-2 border-white text-sm font-semibold text-white shadow-sm transition hover:scale-105 dark:border-gray-800"
                        style={{ background: "var(--brand)" }}
                      >
                        {b.name.slice(0, 2).toUpperCase()}
                        {b.favorite && (
                          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-yellow-400">
                            <i className="fas fa-star text-[10px] text-white" />
                          </span>
                        )}
                      </div>
                      <span className="max-w-14 truncate text-xs text-gray-600 dark:text-gray-400">
                        {b.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === "form" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setMsg(null);
                  if (!amount || amountNum <= 0) {
                    toast.error("Enter an amount.");
                  } else if (minTransfer > 0 && amountNum < minTransfer) {
                    toast.error(`Minimum transfer is ${formatCurrency(currency, minTransfer)}.`);
                  } else if (maxTransfer > 0 && amountNum > maxTransfer) {
                    toast.error(`Maximum transfer is ${formatCurrency(currency, maxTransfer)}.`);
                  } else if (total > balance) {
                    toast.error("Amount plus fee exceeds your available balance.");
                  } else if (isBankMethod) {
                    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
                      toast.error("Fill in the recipient bank details.");
                    } else if (tab === "international" && !swift.trim()) {
                      toast.error("SWIFT/BIC is required.");
                    } else if (pin.length < 4) {
                      toast.error("Enter your transaction PIN.");
                    } else {
                      setStep("review");
                    }
                  } else if (!accountNumber.trim()) {
                    toast.error(`Enter the ${selectedMethod?.detail.toLowerCase()}.`);
                  } else if (pin.length < 4) {
                    toast.error("Enter your transaction PIN.");
                  } else {
                    setStep("review");
                  }
                }}
                className="space-y-4 p-6"
              >
                <div className="rounded-xl border border-gray-200/70 bg-gray-50 p-4 dark:border-gray-700/50 dark:bg-gray-800/60">
                  <div className="mb-2 flex items-center justify-between">
                    <label className={labelClass}>Amount</label>
                    <span className="text-xs text-gray-500">
                      {"Available: "}
                      {fmt(balance)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-lg font-bold text-gray-500 dark:text-gray-400">
                      {currencySymbol(currency)}
                    </span>
                    <input
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                      placeholder="0.00"
                      className="block w-full rounded-xl border-2 border-gray-200 bg-white py-4 pl-16 pr-4 text-2xl font-bold text-gray-900 outline-none transition focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickAmounts.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAmount(String(v))}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        {fmt(v)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmount(String(maxAmountRounded))}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ background: "var(--brand)" }}
                    >
                      Max
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <span>
                      {"Transfer fee: "}
                      {transferCharges}
                      {"%"}
                      {fee > 0 ? ` (${fmt(fee)})` : ""}
                    </span>
                    {minTransfer > 0 && (
                      <span>
                        {"Minimum: "}
                        {fmt(minTransfer)}
                      </span>
                    )}
                    {maxTransfer > 0 && (
                      <span>
                        {"Maximum: "}
                        {fmt(maxTransfer)}
                      </span>
                    )}
                  </div>
                </div>

                {isBankMethod ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Account Name</label>
                      <input
                        value={accountName}
                        onChange={(e) => {
                          setAccountName(e.target.value);
                          setSelectedBeneficiaryId(null);
                        }}
                        placeholder="Recipient full name"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Account Number / IBAN</label>
                      <input
                        value={accountNumber}
                        onChange={(e) => {
                          setAccountNumber(e.target.value);
                          setSelectedBeneficiaryId(null);
                        }}
                        placeholder="Account number / IBAN"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Bank Name</label>
                      <input
                        value={bankName}
                        onChange={(e) => {
                          setBankName(e.target.value);
                          setSelectedBeneficiaryId(null);
                        }}
                        placeholder="Recipient bank"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Account Type</label>
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className={inputClass}
                      >
                        <option>Account</option>
                        <option>Checking</option>
                        <option>Savings</option>
                      </select>
                    </div>
                    {tab === "international" ? (
                      <div>
                        <label className={labelClass}>SWIFT / BIC</label>
                        <input
                          value={swift}
                          onChange={(e) => {
                            setSwift(e.target.value);
                            setSelectedBeneficiaryId(null);
                          }}
                          placeholder="SWIFT / BIC code"
                          className={inputClass}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className={labelClass}>
                          {"Routing Number "}
                          <span className="font-normal text-gray-400">(optional)</span>
                        </label>
                        <input
                          value={routing}
                          onChange={(e) => setRouting(e.target.value)}
                          placeholder="Routing / sort code"
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={labelClass}>Recipient Name</label>
                      <input
                        value={accountName}
                        onChange={(e) => {
                          setAccountName(e.target.value);
                          setSelectedBeneficiaryId(null);
                        }}
                        placeholder="Recipient name"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{selectedMethod?.detail}</label>
                      <input
                        value={accountNumber}
                        onChange={(e) => {
                          setAccountNumber(e.target.value);
                          setSelectedBeneficiaryId(null);
                        }}
                        placeholder={selectedMethod?.detail}
                        className={inputClass}
                      />
                    </div>
                    {selectedMethod?.more && (
                      <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Enter the recipient handle or wallet details.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className={labelClass}>Description</label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this transfer for?"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Transaction PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••"
                    className={inputClass}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={saveBeneficiary}
                    onChange={(e) => setSaveBeneficiary(e.target.checked)}
                    style={{ accentColor: "var(--brand)" }}
                  />
                  {" Save as beneficiary"}
                </label>

                {msg && (
                  <p
                    className={`text-sm ${msg.kind === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {msg.text}
                  </p>
                )}

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01]"
                  style={{ background: "var(--brand)" }}
                >
                  <i className="fas fa-paper-plane" />
                  {" Continue"}
                </button>
              </form>
            ) : (
              <div className="p-6">
                <div className="rounded-xl border border-gray-200/70 bg-gray-50 p-5 dark:border-gray-700/50 dark:bg-gray-800/60">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Review transfer
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <Row k="Method" v={tab === "international" ? method : "Local bank transfer"} />
                    {accountName && <Row k="Recipient" v={accountName} />}
                    <Row
                      k={
                        isBankMethod ? "Account / IBAN" : (selectedMethod?.detail ?? "Destination")
                      }
                      v={accountNumber}
                    />
                    {isBankMethod && <Row k="Bank" v={bankName} />}
                    {tab === "international" && isBankMethod && <Row k="SWIFT/BIC" v={swift} />}
                    {description && <Row k="Description" v={description} />}
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                    <Row k="Amount" v={fmt(amountNum)} />
                    <Row k={`Fee (${transferCharges}%)`} v={fmt(fee)} />
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                    <Row k="Total to debit" v={fmt(total)} strong />
                  </div>
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
                    type="button"
                    onClick={handleExternalTransfer}
                    disabled={submitting}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01] disabled:opacity-60"
                    style={{ background: "var(--brand)" }}
                  >
                    {submitting && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}
                    {" Confirm & Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setMsg(null);
                    }}
                    disabled={submitting}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 sm:flex-none"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
              Select Transfer Method
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setMethod(m.key);
                    setAccountNumber("");
                    setAccountName("");
                    setBankName("");
                    setSwift("");
                    setSelectedBeneficiaryId(null);
                  }}
                  className="cursor-pointer rounded-2xl border border-white/20 bg-white/80 p-3 text-left backdrop-blur-xl transition hover:shadow-lg dark:border-gray-700/50 dark:bg-gray-800/80"
                >
                  <div className="mb-2 flex items-center">
                    <div className={`grid h-8 w-8 place-items-center rounded-xl ${m.wrap}`}>
                      <i className={`${m.icon} ${m.color} text-sm`} />
                    </div>
                    <h3 className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      {m.key}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showReceipt && receipt && (
        <ReceiptModal
          cur={currency}
          receipt={receipt}
          siteName={site.name}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {pendingTransferId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="absolute inset-0"
            onClick={() => {
              setPendingTransferId(null);
              setMsg(null);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-gray-900">
            <div
              className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full"
              style={{ background: `${brandColor}22` }}
            >
              <i className="fa-solid fa-headset text-2xl" style={{ color: brandColor }} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Enter confirmation code
            </h3>
            <p className="mb-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              Our team will give you a 6-digit code to confirm this transfer. Enter it below to send
              the money.
            </p>
            <input
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="------"
              autoFocus
              inputMode="numeric"
              disabled={submitting}
              className="block w-full rounded-xl border-2 bg-white py-4 text-center text-3xl font-bold tracking-[0.3em] sm:tracking-[0.5em] text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-900 dark:text-white"
              style={{ borderColor: `${brandColor}55` }}
            />
            <Link
              href="/support"
              className="mt-3 inline-block text-xs font-medium underline underline-offset-2"
              style={{ color: brandColor }}
            >
              Don&apos;t have your code yet? Contact support
            </Link>
            {msg?.kind === "err" && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{msg.text}</p>
            )}
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPendingTransferId(null);
                  setMsg({
                    kind: "ok",
                    text: "Your transfer is pending -- enter the code to complete it.",
                  });
                  setStep("form");
                }}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Enter later
              </button>
              <button
                type="button"
                onClick={() => void handleVerify()}
                disabled={submitting || verifyCode.length !== 6}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}, rgba(0,0,0,0.25))`,
                }}
              >
                {submitting && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {submitting ? "Confirming…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DoneReceipt({
  cur,
  receipt,
  canShare,
  onShare,
  onView,
  onReset,
  msg,
}: {
  cur: string;
  receipt: Receipt;
  canShare: boolean;
  onShare: () => void;
  onView: () => void;
  onReset: () => void;
  msg: Message | null;
}) {
  const fmt = (value: number) => formatCurrency(cur, value);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95">
      <div
        className="relative px-6 py-10 text-center text-white"
        style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
      >
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full border-4 border-white/30">
          <div className="grid h-12 w-12 animate-pulse place-items-center rounded-full bg-white">
            <i className="fa-solid fa-check text-2xl text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Transfer Successful!</h2>
        <p className="mt-1 text-lg text-white/90">{fmt(receipt.amount)} sent</p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm backdrop-blur-sm">
          <i className="fa-solid fa-user text-xs" />
          {" to "}
          {receipt.recipient}
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard icon="fa-money-bill-transfer" label="Amount" value={fmt(receipt.amount)} />
          <StatCard icon="fa-receipt" label="Fee" value={fmt(receipt.fee)} />
          <StatCard icon="fa-coins" label="Total" value={fmt(receipt.total)} />
        </div>
        <div className="mt-6 rounded-xl border border-gray-200/70 bg-gray-50 p-5 dark:border-gray-700/50 dark:bg-gray-800/60">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Transaction details
          </h3>
          <div className="space-y-2 text-sm">
            <Row k="Reference" v={receipt.ref} mono />
            <Row k="Method" v={receipt.method} />
            <Row
              k={"Date & time"}
              v={receipt.date.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            />
            {receipt.description && <Row k="Description" v={receipt.description} />}
          </div>
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
            type="button"
            onClick={onView}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01]"
            style={{ background: "var(--brand)" }}
          >
            <i className="fa-solid fa-receipt" />
            {" View Receipt"}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={onShare}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <i className="fa-solid fa-share-nodes" />
              {" Share Receipt"}
            </button>
          )}
          {!canShare && (
            <button
              type="button"
              onClick={onShare}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <i className="fa-solid fa-copy" />
              {" Copy Receipt"}
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-900 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            <i className="fa-solid fa-plus" />
            {" New transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptModal({
  cur,
  receipt,
  siteName,
  onClose,
}: {
  cur: string;
  receipt: Receipt;
  siteName: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fmt = (value: number) => formatCurrency(cur, value);

  const printReceipt = () => {
    const el = ref.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=520,height=720");
    if (!win) {
      window.print();
      return;
    }
    win.document.write(
      `<!doctype html><html><head><title>Receipt ${receipt.ref}</title><meta charset="utf-8"><style>body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;padding:32px;max-width:480px;margin:0 auto}h1{font-size:18px;margin:0 0 4px}.muted{color:#6b7280;font-size:12px}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:14px}.row span:first-child{color:#6b7280}.total{font-weight:700;font-size:16px;border-bottom:none}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.head{text-align:center;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:12px}.badge{display:inline-block;margin-top:8px;background:#dcfce7;color:#15803d;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600}</style></head><body>${el.innerHTML}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/20 bg-white shadow-2xl dark:border-gray-700/50 dark:bg-gray-800">
        <div ref={ref}>
          <div className="head px-6 pt-6 text-center">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{siteName}</h1>
            <p className="muted text-xs text-gray-500">Transfer Receipt</p>
            <span className="badge mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
              Completed
            </span>
          </div>
          <div className="px-6 py-4">
            <div className="row flex justify-between border-b border-gray-100 py-2 text-sm dark:border-gray-700">
              <span className="text-gray-500">Recipient</span>
              <span className="font-medium text-gray-900 dark:text-white">{receipt.recipient}</span>
            </div>
            <div className="row flex justify-between border-b border-gray-100 py-2 text-sm dark:border-gray-700">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900 dark:text-white">{receipt.method}</span>
            </div>
            <div className="row flex justify-between border-b border-gray-100 py-2 text-sm dark:border-gray-700">
              <span className="text-gray-500">Amount</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {fmt(receipt.amount)}
              </span>
            </div>
            <div className="row flex justify-between border-b border-gray-100 py-2 text-sm dark:border-gray-700">
              <span className="text-gray-500">Fee</span>
              <span className="font-medium text-gray-900 dark:text-white">{fmt(receipt.fee)}</span>
            </div>
            <div className="row total flex justify-between border-b border-gray-100 py-2 text-base font-bold dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-200">Total</span>
              <span className="text-gray-900 dark:text-white">{fmt(receipt.total)}</span>
            </div>
            {receipt.description && (
              <div className="row flex justify-between border-b border-gray-100 py-2 text-sm dark:border-gray-700">
                <span className="text-gray-500">Description</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {receipt.description}
                </span>
              </div>
            )}
            <div className="row flex justify-between border-b border-gray-100 py-2 text-sm dark:border-gray-700">
              <span className="text-gray-500">Reference</span>
              <span className="mono break-all font-mono text-xs font-medium text-gray-900 dark:text-white">
                {receipt.ref}
              </span>
            </div>
            <div className="row flex justify-between py-2 text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {receipt.date.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 border-t border-gray-100 p-4 dark:border-gray-700">
          <button
            type="button"
            onClick={printReceipt}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            <i className="fa-solid fa-print" />
            {" Print"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 text-center dark:bg-gray-700/40">
      <div
        className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full text-white"
        style={{ background: "var(--brand)" }}
      >
        <i className={`fa-solid ${icon} text-sm`} />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function Row({ k, v, strong, mono }: { k: string; v: string; strong?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{k}</span>
      <span
        className={`text-right ${mono ? "break-all font-mono text-xs" : ""} ${strong ? "text-base font-bold text-gray-900 dark:text-white" : "text-gray-800 dark:text-gray-200"}`}
      >
        {v}
      </span>
    </div>
  );
}
