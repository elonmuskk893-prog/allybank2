"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { KycGate } from "@/components/dashboard/kyc-gate";
import { bankFetch } from "@/lib/api";
import { currencySymbol } from "@/lib/format";

const CARD_TYPES = [
  {
    value: "visa",
    label: "Visa",
    desc: "Accepted worldwide, suitable for most online purchases",
    tag: "VISA",
    tagCls: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50",
  },
  {
    value: "mastercard",
    label: "Mastercard",
    desc: "Global acceptance with enhanced security features",
    tag: "MASTERCARD",
    tagCls: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50",
  },
  {
    value: "american_express",
    label: "American Express",
    desc: "Premium benefits and exclusive rewards program",
    tag: "AMEX",
    tagCls: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50",
  },
];

export default function ApplyForCardPage() {
  return (
    <AppShell>
      <KycGate action="apply for a card">
        <ApplyForm />
      </KycGate>
    </AppShell>
  );
}

function ApplyForm() {
  const me = useMe();
  const primaryCurrency = me.site.primary_currency;
  const router = useRouter();

  const [cardType, setCardType] = useState("visa");
  const [cardLevel, setCardLevel] = useState("");
  const [currency, setCurrency] = useState(primaryCurrency);
  const [dailyLimit, setDailyLimit] = useState("1000");
  const [cardholderName, setCardholderName] = useState(
    [me.user.first_name, me.user.last_name].filter(Boolean).join(" "),
  );
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingZip, setBillingZip] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!cardLevel) {
      setError("Please select a card level.");
      return;
    }
    if (!termsAccepted) {
      setError("Please agree to the Terms and Conditions.");
      return;
    }
    setSubmitting(true);
    const limit = Number(dailyLimit);
    const res = await bankFetch("/cards/apply", {
      method: "POST",
      body: {
        card_brand: cardType === "american_express" ? "mastercard" : cardType,
        currency,
        card_level: cardLevel,
        ...(Number.isFinite(limit) && limit >= 0 ? { daily_limit: limit } : {}),
        ...(billingAddress.trim() ? { billing_address: billingAddress.trim() } : {}),
        ...(billingCity.trim() ? { billing_city: billingCity.trim() } : {}),
        ...(billingZip.trim() ? { billing_zip: billingZip.trim() } : {}),
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "Failed");
      return;
    }
    router.replace("/cards");
  }

  const inputClass =
    "block w-full rounded-lg border border-gray-300 bg-white/90 py-3 px-3 text-sm text-gray-900 shadow-sm backdrop-blur-sm focus:border-transparent focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-800/90 dark:text-white";
  const iconInputClass =
    "block w-full rounded-lg border border-gray-300 bg-white/90 py-3 pl-10 pr-3 text-sm text-gray-900 backdrop-blur-sm placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-800/90 dark:text-white";

  return (
    <div className="-mx-4 -my-5 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 lg:-mx-6 lg:p-6">
      <div className="mx-auto max-w-4xl">
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Apply for Virtual Card
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Get instant access to a virtual card for online payments
                </p>
              </div>
            </div>
            <Link
              href="/cards"
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-300"
            >
              <i className="fas fa-arrow-left mr-2" />
              Back to Cards
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95">
          <div
            className="p-6 text-white"
            style={{ background: "linear-gradient(135deg, var(--brand), rgba(0,0,0,0.4))" }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="mb-2 text-xl font-bold lg:text-2xl">
                  Apply for a Virtual Card
                </h2>
                <p className="text-sm text-white/90">
                  Get instant access to a virtual card for online payments and
                  subscriptions
                </p>
              </div>
              <i className="fas fa-credit-card hidden text-4xl text-white/75 md:block" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="space-y-4">
              <SectionHeader icon="fa-credit-card">Card Details</SectionHeader>
              <div className="space-y-4 rounded-xl border border-gray-200/50 bg-white/80 p-4 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/80">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Card Type
                  </label>
                  <div className="space-y-3">
                    {CARD_TYPES.map((option) => (
                      <label
                        key={option.value}
                        className="relative flex cursor-pointer items-start rounded-xl border border-gray-200 bg-white/90 p-4 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90"
                      >
                        <input
                          type="radio"
                          name="card_type"
                          value={option.value}
                          checked={cardType === option.value}
                          onChange={() => setCardType(option.value)}
                          className="mt-0.5 h-4 w-4"
                          style={{ accentColor: "var(--brand)" }}
                        />
                        <div className="ml-3 flex w-full justify-between">
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {option.label}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {option.desc}
                            </p>
                          </div>
                          <div
                            className={`shrink-0 rounded px-2 py-1 text-xs font-bold ${option.tagCls}`}
                          >
                            {option.tag}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Card Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={cardLevel}
                      onChange={(e) => setCardLevel(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select a card level</option>
                      <option value="standard">Standard</option>
                      <option value="gold">Gold</option>
                      <option value="platinum">Platinum</option>
                      <option value="black">Black</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Different levels offer varied spending limits and features
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className={inputClass}
                    >
                      <option value={primaryCurrency}>
                        {primaryCurrency} - Account Currency
                      </option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Daily Spending Limit
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-sm text-gray-500 dark:text-gray-400">
                        {currencySymbol(primaryCurrency)}
                      </span>
                      <input
                        type="number"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white/90 py-3 pl-12 pr-3 text-sm text-gray-900 backdrop-blur-sm focus:border-transparent focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-800/90 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader icon="fa-user">Billing Information</SectionHeader>
              <div className="space-y-4 rounded-xl border border-gray-200/50 bg-white/80 p-4 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/80">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Field
                    span
                    label="Cardholder Name"
                    icon="fa-user"
                    value={cardholderName}
                    onChange={setCardholderName}
                    placeholder="Enter full name as it should appear on card"
                    cls={iconInputClass}
                  />
                  <Field
                    span
                    label="Billing Address"
                    icon="fa-map-marker-alt"
                    value={billingAddress}
                    onChange={setBillingAddress}
                    placeholder="Enter your billing address"
                    cls={iconInputClass}
                  />
                  <Field
                    label="City"
                    icon="fa-city"
                    value={billingCity}
                    onChange={setBillingCity}
                    placeholder="Enter city"
                    cls={iconInputClass}
                  />
                  <Field
                    label="ZIP/Postal Code"
                    icon="fa-mail-bulk"
                    value={billingZip}
                    onChange={setBillingZip}
                    placeholder="Enter ZIP code"
                    cls={iconInputClass}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-50/80 to-blue-50/80 p-4 backdrop-blur-sm dark:border-gray-600/50 dark:from-gray-800/90 dark:to-gray-900/90">
              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded"
                  style={{ accentColor: "var(--brand)" }}
                />
                <div className="text-sm">
                  <label
                    htmlFor="terms"
                    className="font-semibold text-gray-900 dark:text-white"
                  >
                    I agree to the Terms and Conditions
                  </label>
                  <p className="mt-1 text-xs text-gray-700 dark:text-gray-200">
                    By checking this box, you agree to our virtual card terms,
                    including fees, limits, and usage policies. You also consent
                    to electronic communications regarding your card account.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex flex-col gap-2 pt-2 lg:flex-row lg:gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60 lg:flex-1"
                style={{ background: "var(--brand)" }}
              >
                {submitting ? (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <i className="fas fa-credit-card mr-2" />
                )}
                Submit Application
              </button>
              <Link
                href="/cards"
                className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white/70 px-6 py-3 text-base font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-300 lg:w-auto"
              >
                <i className="fas fa-arrow-left mr-2" />
                Back to Cards
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Feature
            icon="fa-shield-alt"
            grad="linear-gradient(to right,#22c55e,#059669)"
            title="Secure"
            desc="Bank-level security with real-time fraud monitoring and instant notifications."
          />
          <Feature
            icon="fa-bolt"
            grad="linear-gradient(to right,#3b82f6,#2563eb)"
            title="Instant"
            desc="Get your virtual card instantly after approval. Start using it for online purchases immediately."
          />
          <Feature
            icon="fa-sliders-h"
            grad="linear-gradient(to right,#a855f7,#9333ea)"
            title="Control"
            desc="Set spending limits, freeze cards instantly, and monitor all transactions in real-time."
          />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <div
        className="grid h-6 w-6 place-items-center rounded-lg text-white"
        style={{ background: "var(--brand)" }}
      >
        <i className={`fas ${icon} text-xs`} />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        {children}
      </h3>
    </div>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  cls,
  span,
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  cls: string;
  span?: boolean;
}) {
  return (
    <div className={span ? "lg:col-span-2" : ""}>
      <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
          <i className={`fas ${icon} text-gray-400 dark:text-gray-500`} />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      </div>
    </div>
  );
}

function Feature({
  icon,
  grad,
  title,
  desc,
}: {
  icon: string;
  grad: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200/50 bg-white/70 p-4 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/70">
      <div className="mb-2 flex items-center gap-3">
        <div
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={{ background: grad }}
        >
          <i className={`fas ${icon} text-sm text-white`} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  );
}