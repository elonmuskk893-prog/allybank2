import Link from "@/lib/next/link";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-10 top-10 h-32 w-32 animate-pulse rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute right-10 top-1/2 h-40 w-40 animate-pulse rounded-full bg-teal-500 blur-3xl" />
          <div className="absolute bottom-10 left-1/2 h-36 w-36 animate-pulse rounded-full bg-purple-500 blur-3xl" />
        </div>
      </div>
      <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center space-x-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-green-100">Account access</span>
          </div>
          <h2 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
            Ready to use your{" "}
            <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              online account?
            </span>
          </h2>
          <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-blue-100 md:text-2xl">
            Sign in to review activity, manage transfers, and contact support.
          </p>
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                <i className="fas fa-wallet text-xl text-white" />
              </div>
              <h3 className="mb-2 font-bold text-white">Account overview</h3>
              <p className="text-sm text-blue-100">Review balances and recent transactions.</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                <i className="fas fa-arrow-right-arrow-left text-xl text-white" />
              </div>
              <h3 className="mb-2 font-bold text-white">Transfer tools</h3>
              <p className="text-sm text-blue-100">Move money between your accounts.</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
                <i className="fas fa-headset text-xl text-white" />
              </div>
              <h3 className="mb-2 font-bold text-white">Support</h3>
              <p className="text-sm text-blue-100">Contact support from your dashboard.</p>
            </div>
          </div>
          <div className="mb-8">
            <Link
              href="/auth/register"
              className="group relative inline-flex max-w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 via-teal-500 to-blue-500 px-6 py-5 text-xl font-bold text-white shadow-2xl transition-all duration-300 hover:from-blue-600 hover:via-teal-600 hover:to-blue-600 sm:min-w-[280px] sm:px-12"
            >
              <span className="relative z-10 flex items-center">
                <i className="fas fa-user-plus mr-3" />
                Create an account
                <i className="fas fa-arrow-right ml-3 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 text-white sm:flex-row">
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/60 hover:bg-white/20"
            >
              <i className="fas fa-sign-in-alt mr-2" />
              Sign in
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 font-semibold text-blue-200 transition-colors hover:text-white"
            >
              <i className="fas fa-question-circle mr-2" />
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
