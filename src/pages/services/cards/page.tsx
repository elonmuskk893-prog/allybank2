"use client";

import Link from "@/lib/next/link";
import { PublicLayout } from "@/components/landing/public-layout";

const COLORS = {
  blue: {
    grad: "from-blue-600 to-blue-800",
    textTint: "text-blue-100",
    iconTint: "text-blue-200",
    btnText: "text-blue-600",
    btnHover: "hover:bg-blue-50",
  },
  purple: {
    grad: "from-purple-600 to-purple-800",
    textTint: "text-purple-100",
    iconTint: "text-purple-200",
    btnText: "text-purple-600",
    btnHover: "hover:bg-purple-50",
  },
  green: {
    grad: "from-green-600 to-green-800",
    textTint: "text-green-100",
    iconTint: "text-green-200",
    btnText: "text-green-600",
    btnHover: "hover:bg-green-50",
  },
  orange: {
    grad: "from-orange-600 to-orange-800",
    textTint: "text-orange-100",
    iconTint: "text-orange-200",
    btnText: "text-orange-600",
    btnHover: "hover:bg-orange-50",
  },
  teal: {
    grad: "from-teal-600 to-teal-800",
    textTint: "text-teal-100",
    iconTint: "text-teal-200",
    btnText: "text-teal-600",
    btnHover: "hover:bg-teal-50",
  },
  gray: {
    grad: "from-gray-600 to-gray-800",
    textTint: "text-gray-100",
    iconTint: "text-gray-200",
    btnText: "text-gray-600",
    btnHover: "hover:bg-gray-50",
  },
};

const CARDS: { color: keyof typeof COLORS; icon: string; title: string; sub: string; perks: string[]; big: string; note: string; cta: string }[] = [
  {
    color: "blue",
    icon: "fa-solid fa-credit-card",
    title: "Cashback Rewards",
    sub: "Credit Card",
    perks: [
      "3% cashback on groceries",
      "2% on gas and dining",
      "1% on all other purchases",
      "No annual fee",
    ],
    big: "0% APR",
    note: "For 15 months on purchases",
    cta: "Apply Now",
  },
  {
    color: "purple",
    icon: "fa-solid fa-plane",
    title: "Travel Rewards",
    sub: "Premium Credit Card",
    perks: [
      "3x points on travel & dining",
      "50,000 bonus points",
      "Airport lounge access",
      "Travel insurance included",
    ],
    big: "$95",
    note: "Annual fee (waived first year)",
    cta: "Apply Now",
  },
  {
    color: "green",
    icon: "fa-solid fa-briefcase",
    title: "Business Card",
    sub: "For Small Business",
    perks: [
      "2% on business purchases",
      "Expense management tools",
      "Employee cards included",
      "Higher credit limits",
    ],
    big: "No Fee",
    note: "For the first year",
    cta: "Apply Now",
  },
  {
    color: "orange",
    icon: "fa-solid fa-graduation-cap",
    title: "Student Card",
    sub: "Build Your Credit",
    perks: [
      "1% cashback on all purchases",
      "No annual fee",
      "Credit education resources",
      "Easy approval process",
    ],
    big: "$100",
    note: "Sign-up bonus",
    cta: "Apply Now",
  },
  {
    color: "teal",
    icon: "fa-solid fa-shield-halved",
    title: "Secured Card",
    sub: "Rebuild Your Credit",
    perks: [
      "Build credit history",
      "Refundable security deposit",
      "Credit monitoring tools",
      "Upgrade eligibility",
    ],
    big: "$200",
    note: "Minimum deposit",
    cta: "Apply Now",
  },
  {
    color: "gray",
    icon: "fa-solid fa-university",
    title: "Debit Card",
    sub: "Everyday Banking",
    perks: [
      "No overdraft fees",
      "Worldwide ATM access",
      "Contactless payments",
      "Mobile wallet support",
    ],
    big: "Free",
    note: "With qualifying account",
    cta: "Get Card",
  },
];

const FEATURES = [
  {
    icon: "fa-solid fa-shield-halved",
    title: "Fraud Protection",
    body: "24/7 monitoring and zero liability for unauthorized transactions",
  },
  {
    icon: "fa-solid fa-mobile-alt",
    title: "Mobile Banking",
    body: "Manage your cards, view transactions, and pay bills on the go",
  },
  {
    icon: "fa-solid fa-wifi",
    title: "Contactless Pay",
    body: "Tap to pay with your card or mobile wallet for quick transactions",
  },
  {
    icon: "fa-solid fa-globe",
    title: "Global Acceptance",
    body: "Use your card anywhere Visa or Mastercard is accepted worldwide",
  },
];

export default function CardsPage() {
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
            <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-semibold mb-6 border border-white/20">
                <i className="fa-solid fa-credit-card mr-2" />
                Credit & Debit Cards
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                Banking Cards
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Secure, convenient, and rewarding cards for all your financial needs
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Choose Your Card
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Find the perfect card to match your lifestyle and financial goals
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {CARDS.map((card) => {
                const color = COLORS[card.color];
                return (
                  <div
                    key={card.title}
                    className={`bg-gradient-to-br ${color.grad} rounded-2xl p-8 text-white relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                          <p className={color.textTint}>{card.sub}</p>
                        </div>
                        <i className={`${card.icon} text-2xl ${color.iconTint}`} />
                      </div>
                      <div className="space-y-3 mb-6">
                        {card.perks.map((perk) => (
                          <div key={perk} className="flex items-center">
                            <i className="fa-solid fa-check-circle mr-3 text-green-300" />
                            <span className="text-sm">{perk}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-2xl font-bold mb-4">{card.big}</div>
                      <p className={`text-sm ${color.textTint} mb-6`}>{card.note}</p>
                      <Link
                        href="/auth/register"
                        className={`block w-full bg-white font-bold py-3 px-6 rounded-xl ${color.btnText} ${color.btnHover} transition-colors text-center`}
                      >
                        {card.cta}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Card Features & Benefits
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Enjoy premium features and security with all our banking cards
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <i className={`${feature.icon} text-2xl text-blue-600 dark:text-blue-400`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-blue-600 dark:bg-blue-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Get Your Card?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Apply online in minutes and start enjoying the benefits of our banking cards
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <i className="fa-solid fa-credit-card mr-3" />
                Apply for Card
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-2xl transition-all duration-300 border-2 border-white/30"
              >
                <i className="fa-solid fa-phone mr-3" />
                Compare Cards
              </Link>
            </div>
          </div>
        </section>
      </>
    </PublicLayout>
  );
}