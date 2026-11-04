"use client";

import { PublicLayout } from "@/components/landing/public-layout";
import { useSite } from "@/lib/use-site";

function AppsPage() {
  useSite();

  return (
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
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-semibold mb-6 border border-white/20">
                <i className="fa-solid fa-mobile-alt mr-2" />
                Online Access
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Account Access From Your Browser
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Sign in from a modern desktop or mobile browser. No download is required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/auth/login"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-colors font-semibold"
                >
                  <i className="fa-solid fa-right-to-bracket text-xl mr-3" />
                  Sign In
                </a>
                <a
                  href="/auth/register"
                  className="inline-flex items-center px-6 py-3 bg-blue-800 text-white rounded-xl hover:bg-blue-900 transition-colors font-semibold"
                >
                  <i className="fa-solid fa-user-plus text-xl mr-3" />
                  Create Account
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="/hero-bg.jpg"
                  alt="Account dashboard preview"
                  className="w-full max-w-md mx-auto rounded-3xl shadow-2xl"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features at Your Fingertips
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to manage your finances, all in one convenient mobile app
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-chart-pie text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Account Overview
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                View all your accounts, balances, and recent transactions in one place.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Balance updates in your dashboard
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Transaction history
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Account statements
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-money-bill-transfer text-2xl text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Send Money</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Move funds between your own accounts or to saved beneficiaries.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Account-to-account transfers
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Saved beneficiaries
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Transfer status tracking
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-file-invoice-dollar text-2xl text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Bill Pay</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Schedule and pay all your bills from one convenient location.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Automatic payments
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Payment reminders
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Payee management
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-camera text-2xl text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Document Upload
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Upload a receipt or supporting document through the deposit flow.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Receipt image or PDF
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Private storage
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Files up to 10MB
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-credit-card text-2xl text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Card Controls
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Manage your debit and credit cards with advanced security features.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Lock/unlock supported cards
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Set spending limits
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Transaction alerts
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-chart-bar text-2xl text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Budgeting</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Track spending, set budgets, and achieve your financial goals.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Spending categories
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Budget alerts
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Financial insights
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Account Security
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Review the security controls available for your account.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-right-to-bracket text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Password Sign-In
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sign in with your email and password, plus optional 2FA.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-shield-halved text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Encrypted Connection
              </h3>
              <p className="text-gray-600 dark:text-gray-300">TLS helps protect data in transit.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-bell text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Activity Alerts
              </h3>
              <p className="text-gray-600 dark:text-gray-300">Notifications for account activity</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-user-shield text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Fraud Protection
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Session controls and activity history
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              See It in Action
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Take a look at the account dashboard interface
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl h-96 flex items-center justify-center mb-4">
                <i className="fa-solid fa-mobile-alt text-6xl text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Dashboard
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Complete overview of all your accounts and recent activity
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl h-96 flex items-center justify-center mb-4">
                <i className="fa-solid fa-exchange-alt text-6xl text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Transfers
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Quick and easy money transfers with just a few taps
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl h-96 flex items-center justify-center mb-4">
                <i className="fa-solid fa-chart-pie text-6xl text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Insights</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Detailed spending analysis and budgeting tools
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Use Your Account Online
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Access the dashboard from a modern desktop or mobile browser. No download is required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/login"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-700 rounded-2xl hover:bg-blue-50 transition-colors shadow-lg font-semibold"
            >
              <i className="fa-solid fa-right-to-bracket text-xl mr-3" />
              Sign In
            </a>
            <a
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-blue-800 text-white rounded-2xl hover:bg-blue-900 transition-colors shadow-lg font-semibold"
            >
              <i className="fa-solid fa-user-plus text-xl mr-3" />
              Create Account
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Page() {
  return (
    <PublicLayout>
      <AppsPage />
    </PublicLayout>
  );
}
