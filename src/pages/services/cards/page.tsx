"use client";

import Link from "@/lib/next/link";
import { PublicLayout } from "@/components/landing/public-layout";

const FEATURES = [
  {
    icon: "fa-solid fa-credit-card",
    title: "Card Overview",
    body: "Review the cards and card details available on your account.",
  },
  {
    icon: "fa-solid fa-snowflake",
    title: "Freeze Controls",
    body: "Freeze or unfreeze supported cards from the dashboard.",
  },
  {
    icon: "fa-solid fa-sliders",
    title: "Spending Controls",
    body: "Review or update available limits for supported cards.",
  },
  {
    icon: "fa-solid fa-list-check",
    title: "Card Activity",
    body: "Review card transactions alongside your account activity.",
  },
] as const;

export default function CardsPage() {
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
              <i className="fa-solid fa-credit-card mr-2" />
              Card Management
            </div>
            <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Cards in Your Account
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-gray-300">
              Review your available card features, controls and activity. Card availability depends on your account and region.
            </p>
          </div>
        </section>

        <section className="bg-white py-16 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
                Card Controls
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                The options shown in your dashboard are the options available for your account.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                    <i className={`${feature.icon} text-2xl text-blue-600 dark:text-blue-400`} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-16 dark:bg-gray-800">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
              Before You Apply
            </h2>
            <p className="mx-auto mb-8 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
              Card applications are subject to review. Fees, limits and eligibility are shown before you submit an application.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/cards"
                className="inline-flex items-center rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-blue-700"
              >
                <i className="fa-solid fa-credit-card mr-3" />
                View My Cards
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-2xl border-2 border-gray-300 px-8 py-4 font-semibold text-gray-700 transition hover:border-gray-400 dark:border-gray-600 dark:text-gray-200"
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
