import Link from "@/lib/next/link";

const PREVIEW_ITEMS = [
  { icon: "fa-gauge-high", label: "Dashboard", detail: "Balances and recent activity" },
  { icon: "fa-paper-plane", label: "Transfers", detail: "Send funds to beneficiaries" },
  { icon: "fa-receipt", label: "Transactions", detail: "Filter and review activity" },
  { icon: "fa-gear", label: "Settings", detail: "Profile and security options" },
] as const;

export function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[760px] items-center justify-center overflow-hidden bg-slate-900"
    >
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/hero-bg.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-blue-900/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-transparent to-slate-900" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8 text-left">
            <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>
              <span>Online Account Dashboard</span>
            </div>
            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
              Your account,
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                clearly organized
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Sign in to review balances, transfers, card controls and account activity from a modern
              browser.
            </p>
            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-base font-bold text-white transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Create Account
                <i className="fas fa-arrow-right ml-2" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-4 text-base font-medium text-slate-200 backdrop-blur-md transition-all hover:bg-slate-800 hover:text-white focus:outline-none"
              >
                <i className="fas fa-play-circle mr-2 text-indigo-400" />
                How It Works
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-8 border-t border-slate-800/60 pt-8">
              <div>
                <p className="text-3xl font-bold text-white">2FA</p>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
                  Optional protection
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">KYC</p>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
                  When required
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">Inbox</p>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
                  Support history
                </p>
              </div>
            </div>
          </div>
          <div className="relative hidden h-[560px] w-full lg:block">
            <div className="absolute right-10 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[100px]" />
            <div className="absolute bottom-0 left-10 h-80 w-80 rounded-full bg-cyan-600/20 blur-[80px]" />
            <div className="absolute left-1/2 top-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Account Preview</p>
                  <h3 className="mt-1 text-2xl font-bold text-white">Available Tools</h3>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-500">
                  <i className="fas fa-wallet text-white" />
                </div>
              </div>
              <div className="space-y-3">
                {PREVIEW_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-500/20 text-indigo-300">
                      <i className={`fas ${item.icon}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-xs text-slate-500">
                Preview only. Features depend on your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
