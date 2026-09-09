"use client";

import Link from "next/link";
import { PublicLayout } from "@/components/landing/public-layout";

const TINTS = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    iconFg: "text-blue-600 dark:text-blue-400",
    link: "text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    iconFg: "text-purple-600 dark:text-purple-400",
    link: "text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 transition-colors",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    iconFg: "text-green-600 dark:text-green-400",
    link: "text-green-600 dark:text-green-400 font-semibold hover:text-green-700 dark:hover:text-green-300 transition-colors",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    iconFg: "text-red-600 dark:text-red-400",
    link: "text-red-600 dark:text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300 transition-colors",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    iconFg: "text-orange-600 dark:text-orange-400",
    link: "text-orange-600 dark:text-orange-400 font-semibold hover:text-orange-700 dark:hover:text-orange-300 transition-colors",
  },
  teal: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    iconFg: "text-teal-600 dark:text-teal-400",
    link: "text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors",
  },
} as const;

type TintKey = keyof typeof TINTS;

const GRANTS = [
  {
    icon: "fa-solid fa-store",
    tint: "blue",
    title: "Small Business Grant",
    body: "Up to $50,000 in funding for small business startups and expansion projects.",
    items: [
      "No collateral required",
      "Flexible repayment terms",
      "Business mentorship included",
    ],
  },
  {
    icon: "fa-solid fa-graduation-cap",
    tint: "purple",
    title: "Education Grant",
    body: "Financial assistance for higher education, vocational training, and skill development.",
    items: ["Up to $25,000 per year", "Merit-based selection", "Career guidance support"],
  },
  {
    icon: "fa-solid fa-home",
    tint: "green",
    title: "Home Ownership Grant",
    body: "Down payment assistance and closing cost support for first-time homebuyers.",
    items: ["Up to $15,000 assistance", "First-time buyer priority", "Homebuyer education"],
  },
  {
    icon: "fa-solid fa-heart",
    tint: "red",
    title: "Emergency Relief Grant",
    body: "Immediate financial assistance for unexpected emergencies and hardships.",
    items: ["Quick approval process", "Up to $10,000 immediate", "24/7 application support"],
  },
  {
    icon: "fa-solid fa-users",
    tint: "orange",
    title: "Community Development",
    body: "Support for community projects, non-profits, and local development initiatives.",
    items: ["Up to $100,000 funding", "Community impact focus", "Ongoing project support"],
  },
  {
    icon: "fa-solid fa-stethoscope",
    tint: "teal",
    title: "Healthcare Grant",
    body: "Medical expense assistance and healthcare accessibility support programs.",
    items: [
      "Medical bill assistance",
      "Prescription drug support",
      "Health insurance help",
    ],
  },
] as const;

const STEPS = [
  {
    n: "1",
    title: "Choose Program",
    body: "Select the grant program that best fits your needs",
  },
  {
    n: "2",
    title: "Submit Application",
    body: "Complete our online application with required documents",
  },
  {
    n: "3",
    title: "Review Process",
    body: "Our team reviews your application within 5-7 business days",
  },
  {
    n: "4",
    title: "Receive Funding",
    body: "Approved grants are disbursed directly to your account",
  },
] as const;

export default function GrantsServicesPage() {
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
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-semibold mb-6 border border-white/20">
                <i className="fa-solid fa-hand-holding-dollar mr-2" />
                Financial Assistance
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                Grants &amp; Financial Aid
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Supporting your dreams with accessible funding opportunities and financial assistance programs
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Available Grant Programs
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Explore our comprehensive grant programs designed to support various financial needs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {GRANTS.map((e) => {
                const t = TINTS[e.tint as TintKey];
                return (
                  <div
                    key={e.title}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className={`w-16 h-16 ${t.bg} rounded-2xl flex items-center justify-center mb-6`}>
                      <i className={`${e.icon} text-2xl ${t.iconFg}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {e.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{e.body}</p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                      {e.items.map((item) => (
                        <li key={item} className="flex items-center">
                          <i className="fa-solid fa-check text-green-500 mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <a href="#apply" className={`inline-flex items-center ${t.link}`}>
                      Learn More <i className="fa-solid fa-arrow-right ml-2" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="apply" className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                How to Apply
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Simple steps to get the financial assistance you need
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {STEPS.map((e) => (
                <div key={e.n} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {e.n}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {e.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{e.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-blue-600 dark:bg-blue-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Apply for a Grant?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Take the first step towards achieving your financial goals with our grant programs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <i className="fa-solid fa-file-alt mr-3" />
                Start Application
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