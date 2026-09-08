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
                Mobile Banking
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Banking Made Mobile
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Take control of your finances with our award-winning mobile banking app. Available for iOS and Android.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#"
                  className="inline-flex items-center px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <i className="fa-brands fa-apple text-2xl mr-3" />
                  <div className="text-left">
                    <div className="text-xs">Download on the</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <i className="fa-brands fa-google-play text-2xl mr-3" />
                  <div className="text-left">
                    <div className="text-xs">Get it on</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="Mobile banking app interface"
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Account Overview</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                View all your accounts, balances, and recent transactions in one place.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Real-time balance updates
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
                Transfer money instantly to friends, family, or between your accounts.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Instant transfers
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Zelle integration
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  International wire transfers
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Mobile Deposit</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Deposit checks instantly by taking a photo with your phone.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Photo check deposit
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Instant availability
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Deposit limits up to $10K
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-credit-card text-2xl text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Card Controls</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Manage your debit and credit cards with advanced security features.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <i className="fa-solid fa-check text-green-500 mr-2" />
                  Lock/unlock cards instantly
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
              Bank-Level Security
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Your security is our priority with advanced protection features built into every aspect of our app
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-fingerprint text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Biometric Login</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Secure access with fingerprint and face recognition
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-shield-halved text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">256-bit Encryption</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Military-grade encryption protects all your data
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-bell text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Alerts</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Instant notifications for all account activity
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-user-shield text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fraud Protection</h3>
              <p className="text-gray-600 dark:text-gray-300">
                24/7 monitoring and zero liability guarantee
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
              Take a look at our intuitive interface designed for modern banking
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl h-96 flex items-center justify-center mb-4">
                <i className="fa-solid fa-mobile-alt text-6xl text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Complete overview of all your accounts and recent activity
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl h-96 flex items-center justify-center mb-4">
                <i className="fa-solid fa-exchange-alt text-6xl text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Transfers</h3>
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
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Download Our App Today</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join millions of satisfied customers who bank with confidence using our mobile app
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-flex items-center px-8 py-4 bg-black text-white rounded-2xl hover:bg-gray-800 transition-colors shadow-lg"
            >
              <i className="fa-brands fa-apple text-3xl mr-4" />
              <div className="text-left">
                <div className="text-sm">Download on the</div>
                <div className="text-lg font-semibold">App Store</div>
              </div>
            </a>
            <a
              href="#"
              className="inline-flex items-center px-8 py-4 bg-black text-white rounded-2xl hover:bg-gray-800 transition-colors shadow-lg"
            >
              <i className="fa-brands fa-google-play text-3xl mr-4" />
              <div className="text-left">
                <div className="text-sm">Get it on</div>
                <div className="text-lg font-semibold">Google Play</div>
              </div>
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