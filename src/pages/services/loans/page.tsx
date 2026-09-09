"use client";

import Link from "next/link";
import { useState } from "react";
import { PublicLayout } from "@/components/landing/public-layout";

const TINTS = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    iconFg: "text-blue-600 dark:text-blue-400",
    rateFg: "font-semibold text-blue-600 dark:text-blue-400",
    link: "text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    iconFg: "text-green-600 dark:text-green-400",
    rateFg: "font-semibold text-green-600 dark:text-green-400",
    link: "text-green-600 dark:text-green-400 font-semibold hover:text-green-700 dark:hover:text-green-300 transition-colors",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    iconFg: "text-purple-600 dark:text-purple-400",
    rateFg: "font-semibold text-purple-600 dark:text-purple-400",
    link: "text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 transition-colors",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    iconFg: "text-orange-600 dark:text-orange-400",
    rateFg: "font-semibold text-orange-600 dark:text-orange-400",
    link: "text-orange-600 dark:text-orange-400 font-semibold hover:text-orange-700 dark:hover:text-orange-300 transition-colors",
  },
  teal: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    iconFg: "text-teal-600 dark:text-teal-400",
    rateFg: "font-semibold text-teal-600 dark:text-teal-400",
    link: "text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    iconFg: "text-red-600 dark:text-red-400",
    rateFg: "font-semibold text-red-600 dark:text-red-400",
    link: "text-red-600 dark:text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300 transition-colors",
  },
};

const LOANS: { icon: string; tint: keyof typeof TINTS; title: string; body: string; rate: string; amount: string; term: string }[] = [
  {
    icon: "fa-solid fa-home",
    tint: "blue",
    title: "Home Loans",
    body: "Competitive mortgage rates for first-time buyers and refinancing.",
    rate: "From 3.25% APR",
    amount: "Up to $1M",
    term: "15-30 years",
  },
  {
    icon: "fa-solid fa-car",
    tint: "green",
    title: "Auto Loans",
    body: "Finance your dream car with our competitive auto loan rates.",
    rate: "From 2.99% APR",
    amount: "Up to $100K",
    term: "3-7 years",
  },
  {
    icon: "fa-solid fa-user",
    tint: "purple",
    title: "Personal Loans",
    body: "Flexible personal loans for any purpose with quick approval.",
    rate: "From 5.99% APR",
    amount: "Up to $50K",
    term: "2-7 years",
  },
  {
    icon: "fa-solid fa-briefcase",
    tint: "orange",
    title: "Business Loans",
    body: "Grow your business with our flexible commercial lending solutions.",
    rate: "From 4.25% APR",
    amount: "Up to $5M",
    term: "1-25 years",
  },
  {
    icon: "fa-solid fa-graduation-cap",
    tint: "teal",
    title: "Student Loans",
    body: "Invest in your education with competitive student loan rates.",
    rate: "From 3.75% APR",
    amount: "Up to $200K",
    term: "5-20 years",
  },
  {
    icon: "fa-solid fa-house-circle-check",
    tint: "red",
    title: "Home Equity",
    body: "Tap into your home&apos;s equity for major expenses or investments.",
    rate: "From 4.50% APR",
    amount: "Up to $500K",
    term: "5-30 years",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Apply Online",
    body: "Complete our secure online application in minutes",
  },
  {
    n: "2",
    title: "Quick Review",
    body: "Our team reviews your application within 24 hours",
  },
  {
    n: "3",
    title: "Get Approved",
    body: "Receive your approval decision and loan terms",
  },
  {
    n: "4",
    title: "Receive Funds",
    body: "Funds deposited directly into your account",
  },
];

function formatMoney(e: number) {
  return (
    (0 > Number(e.toFixed(2)) ? "-" : "") +
    "$" +
    Math.abs(e)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
}

export default function LoansPage() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<{ monthly: string; interest: string; total: string } | null>(null);

  return (
    <PublicLayout>
      <>
        <section className="relative py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-gray-900 dark:from-gray-900 dark:via-blue-900 dark:to-black overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 25% 25%, #ffffff 1px, transparent 1px), radial-gradient(circle at 75% 75%, #ffffff 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                  animation: "float 20s ease-in-out infinite",
                }}
              />
            </div>
            <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-semibold mb-6 border border-white/20">
                <i className="fa-solid fa-hand-holding-dollar mr-2" />
                Lending Solutions
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                Loans & Financing
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Competitive rates and flexible terms to help you achieve your financial goals
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Loan Options
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Find the perfect loan solution for your personal or business needs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {LOANS.map((loan) => {
                const tint = TINTS[loan.tint];
                return (
                  <div
                    key={loan.title}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className={`w-16 h-16 ${tint.bg} rounded-2xl flex items-center justify-center mb-6`}>
                      <i className={`${loan.icon} text-2xl ${tint.iconFg}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {loan.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{loan.body}</p>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                      <div className="flex justify-between">
                        <span>Interest Rate:</span>
                        <span className={tint.rateFg}>{loan.rate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loan Amount:</span>
                        <span className="font-semibold">{loan.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Term:</span>
                        <span className="font-semibold">{loan.term}</span>
                      </div>
                    </div>
                    <a href="#apply" className={`inline-flex items-center ${tint.link}`}>
                      Apply Now <i className="fa-solid fa-arrow-right ml-2" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Loan Calculator
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Estimate your monthly payments with our loan calculator
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Loan Amount
                    </label>
                    <input
                      type="number"
                      placeholder="$25,000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      placeholder="5.99"
                      step="0.01"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Loan Term (years)
                    </label>
                    <input
                      type="number"
                      placeholder="5"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const p = parseFloat(amount) || 0;
                      const r = parseFloat(rate) || 0;
                      const n = parseFloat(term) || 0;
                      if (p > 0 && r > 0 && n > 0) {
                        const i = r / 100 / 12;
                        const periods = 12 * n;
                        const monthly = (i * Math.pow(1 + i, periods) * p) / (Math.pow(1 + i, periods) - 1);
                        const total = monthly * periods;
                        setResult({
                          monthly: formatMoney(monthly),
                          interest: formatMoney(total - p),
                          total: formatMoney(total),
                        });
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                  >
                    Calculate Payment
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Payment Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Monthly Payment:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {result?.monthly ?? "$0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Total Interest:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {result?.interest ?? "$0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Total Payment:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {result?.total ?? "$0"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="apply" className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Easy Application Process
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Get approved in minutes with our streamlined application process
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {STEPS.map((step) => (
                <div key={step.n} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-blue-600 dark:bg-blue-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Apply for a Loan?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Get started with your loan application today and receive a decision within 24 hours
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <i className="fa-solid fa-file-alt mr-3" />
                Apply Now
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-2xl transition-all duration-300 border-2 border-white/30"
              >
                <i className="fa-solid fa-phone mr-3" />
                Speak with Advisor
              </Link>
            </div>
          </div>
        </section>
      </>
    </PublicLayout>
  );
}