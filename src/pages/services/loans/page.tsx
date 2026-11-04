"use client";

import { useState } from "react";
import Link from "@/lib/next/link";
import { PublicLayout } from "@/components/landing/public-layout";

const STEPS = [
  {
    n: "1",
    title: "Review Options",
    body: "Open your account to see whether a loan application is available.",
  },
  {
    n: "2",
    title: "Submit Information",
    body: "Provide the requested details and supporting documents.",
  },
  {
    n: "3",
    title: "Review",
    body: "Timelines and requirements vary by application.",
  },
  {
    n: "4",
    title: "Decision",
    body: "Any decision and terms are shown in your account.",
  },
] as const;

function formatMoney(value: number) {
  return `$${Math.abs(value)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export default function LoansPage() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<{ monthly: string; interest: string; total: string } | null>(
    null,
  );

  return (
    <PublicLayout>
      <>
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-gray-900 py-16 lg:py-20 dark:from-gray-900 dark:via-blue-900 dark:to-black">
          <div className="absolute inset-0 opacity-10">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25% 25%, #ffffff 1px, transparent 1px), radial-gradient(circle at 75% 75%, #ffffff 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
              <i className="fa-solid fa-landmark mr-2" />
              Loan Tools
            </div>
            <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Loan Calculator
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-gray-300">
              Estimate a monthly payment using the amount, rate and term you enter.
            </p>
          </div>
        </section>

        <section className="bg-white py-16 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              <div>
                <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                  Payment Estimate
                </h2>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  This calculator is for illustration only. It is not a loan offer, pre-approval or guarantee of terms.
                </p>
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const principal = parseFloat(amount.replace(/[^0-9.]/g, "")) || 0;
                    const annualRate = parseFloat(rate) || 0;
                    const months = parseInt(term, 10) || 0;
                    if (principal <= 0 || months <= 0) {
                      setResult(null);
                      return;
                    }
                    const monthlyRate = annualRate / 100 / 12;
                    const monthly =
                      monthlyRate === 0
                        ? principal / months
                        : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
                    const total = monthly * months;
                    setResult({
                      monthly: formatMoney(monthly),
                      interest: formatMoney(total - principal),
                      total: formatMoney(total),
                    });
                  }}
                >
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Loan amount
                    </span>
                    <input
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      inputMode="decimal"
                      placeholder="25000"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Annual interest rate (%)
                    </span>
                    <input
                      value={rate}
                      onChange={(event) => setRate(event.target.value)}
                      inputMode="decimal"
                      placeholder="8.5"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Term (months)
                    </span>
                    <input
                      value={term}
                      onChange={(event) => setTerm(event.target.value)}
                      inputMode="numeric"
                      placeholder="36"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    Calculate Estimate
                  </button>
                </form>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                  Estimated Results
                </h3>
                <div className="space-y-4 text-gray-700 dark:text-gray-200">
                  <div className="flex items-center justify-between">
                    <span>Monthly payment</span>
                    <span className="font-bold">{result?.monthly ?? "--"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total interest</span>
                    <span className="font-bold">{result?.interest ?? "--"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total repayment</span>
                    <span className="font-bold">{result?.total ?? "--"}</span>
                  </div>
                </div>
                <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                  Actual terms, if available, are shown before you submit an application.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-16 dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
                Application Process
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                Availability, eligibility and timelines depend on your account and region.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              {STEPS.map((step) => (
                <div key={step.n} className="text-center">
                  <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-blue-600 py-16 dark:bg-blue-700">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
              Review Your Account
            </h2>
            <p className="mb-8 text-xl text-blue-100">
              Check whether a loan application is available for your account.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/loans"
                className="inline-flex items-center rounded-2xl bg-white px-8 py-4 font-bold text-blue-600 shadow-lg transition hover:bg-blue-50"
              >
                <i className="fa-solid fa-landmark mr-3" />
                Open Loans
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-2xl border-2 border-white/30 bg-blue-700 px-8 py-4 font-semibold text-white transition hover:bg-blue-800"
              >
                <i className="fa-solid fa-headset mr-3" />
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </>
    </PublicLayout>
  );
}
