"use client";

import Link from "next/link";
import { PublicLayout } from "@/components/landing/public-layout";

export default function PersonalServicesPage() {
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
            <div className="absolute top-20 left-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-semibold mb-6 border border-white/20">
                <i className="fa-solid fa-user mr-2" />
                For Individuals
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                Personal Banking
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Comprehensive banking solutions tailored to your personal financial needs
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Personal Accounts
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Choose from our range of personal banking accounts designed for your lifestyle
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <i className="fa-solid fa-university text-2xl text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Checking Account
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Everyday banking made easy with no monthly fees and unlimited transactions.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    No monthly maintenance fee
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Free online and mobile banking
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Free debit card
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Overdraft protection available
                  </li>
                </ul>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Open Account <i className="fa-solid fa-arrow-right ml-2" />
                </Link>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <i className="fa-solid fa-piggy-bank text-2xl text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  High-Yield Savings
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Grow your money with competitive interest rates and flexible access.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    2.50% APY interest rate
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    No minimum balance
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    FDIC insured up to $250K
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Mobile banking access
                  </li>
                </ul>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center text-green-600 dark:text-green-400 font-semibold hover:text-green-700 dark:hover:text-green-300 transition-colors"
                >
                  Open Account <i className="fa-solid fa-arrow-right ml-2" />
                </Link>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <i className="fa-solid fa-chart-line text-2xl text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Money Market
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Higher interest rates with check-writing privileges and debit card access.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    3.25% APY interest rate
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    $2,500 minimum balance
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Limited check writing
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Debit card included
                  </li>
                </ul>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  Open Account <i className="fa-solid fa-arrow-right ml-2" />
                </Link>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <i className="fa-solid fa-certificate text-2xl text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Certificate of Deposit
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Lock in guaranteed returns with our competitive CD rates and terms.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Up to 4.50% APY
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Terms from 3 months to 5 years
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    $1,000 minimum deposit
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Guaranteed rate of return
                  </li>
                </ul>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center text-orange-600 dark:text-orange-400 font-semibold hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                >
                  Open Account <i className="fa-solid fa-arrow-right ml-2" />
                </Link>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <i className="fa-solid fa-umbrella text-2xl text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  IRA Accounts
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Plan for retirement with traditional and Roth IRA options.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Traditional and Roth options
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Tax advantages
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Investment options available
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Retirement planning tools
                  </li>
                </ul>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                >
                  Open Account <i className="fa-solid fa-arrow-right ml-2" />
                </Link>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <i className="fa-solid fa-child text-2xl text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Youth Savings
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Help young savers build good financial habits with our youth accounts.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Ages 13-17 eligible
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    No monthly fees
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Financial education resources
                  </li>
                  <li className="flex items-center">
                    <i className="fa-solid fa-check text-green-500 mr-2" />
                    Parent/guardian oversight
                  </li>
                </ul>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center text-pink-600 dark:text-pink-400 font-semibold hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                >
                  Open Account <i className="fa-solid fa-arrow-right ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Digital Banking Features
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Bank anywhere, anytime with our comprehensive digital banking platform
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-mobile-alt text-2xl text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Mobile Banking
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Full-featured mobile app for iOS and Android devices
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-laptop text-2xl text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Online Banking
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Secure web portal for all your banking needs
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-bell text-2xl text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Account Alerts
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Real-time notifications for account activity
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-money-bill-transfer text-2xl text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Bill Pay
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Schedule and manage all your bill payments online
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-blue-600 dark:bg-blue-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Start Your Banking Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Open your personal account today and experience modern banking at its best
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <i className="fa-solid fa-user-plus mr-3" />
                Open Account
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