"use client";

import Link from "@/lib/next/link";
import { PublicLayout } from "@/components/landing/public-layout";
import { useSite } from "@/lib/use-site";

function AboutPage() {
  const { site } = useSite();
  const name = site?.name ?? "Online Banking";

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-gray-900 py-16 lg:py-20 dark:from-gray-900 dark:via-blue-900 dark:to-black">
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute left-0 top-0 h-full w-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25% 25%, #ffffff 1px, transparent 1px), radial-gradient(circle at 75% 75%, #ffffff 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
          </div>
          <div className="absolute left-20 top-20 h-96 w-96 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 h-80 w-80 animate-pulse rounded-full bg-teal-500/20 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
              <i className="fa-solid fa-building-columns mr-2" />
              About
            </div>
            <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              About {name}
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-gray-300">
              Online tools for managing accounts, transfers, cards, and support requests.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
                Our approach
              </h2>
              <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
                {name} gives signed-in members a single place to review account activity, move
                money, manage supported cards, and contact support.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                We focus on clear account information and straightforward controls. Availability
                of individual features depends on your account and the services enabled for it.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl shadow-2xl">
              <img
                src="/hero-bg.jpg"
                alt="Abstract account dashboard background"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
              What we focus on
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Practical tools and clear information for everyday account management.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "fa-shield-halved",
                title: "Account security",
                text: "Optional two-factor authentication, session review, and password controls.",
              },
              {
                icon: "fa-lightbulb",
                title: "Clear tools",
                text: "Dashboards and forms designed to keep common tasks easy to find.",
              },
              {
                icon: "fa-heart",
                title: "Support",
                text: "A support inbox for questions about your account and its features.",
              },
              {
                icon: "fa-users",
                title: "Accessibility",
                text: "Responsive layouts for desktop, tablet, and mobile screens.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                  <i className={`fa-solid ${item.icon} text-2xl text-blue-600 dark:text-blue-400`} />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
              Getting started
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Create an account, verify your email, and sign in to see the features available
              to you.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Create an account", text: "Provide your name and email address." },
              { step: "2", title: "Verify your email", text: "Enter the verification code we send you." },
              { step: "3", title: "Sign in", text: "Open your dashboard and review your account." },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-blue-600 text-xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-16 dark:bg-blue-700">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
            Need help with your account?
          </h2>
          <p className="mb-8 text-xl text-blue-100">
            Our support team can help with account access, verification, and available features.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="inline-flex items-center rounded-2xl bg-white px-8 py-4 font-bold text-blue-700 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <i className="fa-solid fa-user-plus mr-3" />
              Open an Account
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-2xl bg-blue-500/30 px-8 py-4 font-semibold text-white ring-1 ring-white/30 transition-all duration-300 hover:bg-blue-500/50"
            >
              <i className="fa-solid fa-phone mr-3" />
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Page() {
  return (
    <PublicLayout>
      <AboutPage />
    </PublicLayout>
  );
}
