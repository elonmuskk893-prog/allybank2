import Link from "@/lib/next/link";

const controls = [
  {
    icon: "fa-lock",
    title: "Encrypted connections",
    text: "Traffic between your browser and the application is encrypted in transit.",
  },
  {
    icon: "fa-mobile-alt",
    title: "Two-factor authentication",
    text: "Add an email verification step to help protect access to your account.",
  },
  {
    icon: "fa-fingerprint",
    title: "Session and PIN controls",
    text: "Review active sessions, change your password, and manage your account PIN.",
  },
  {
    icon: "fa-eye",
    title: "Activity history",
    text: "Review account activity and transaction history from your dashboard.",
  },
  {
    icon: "fa-credit-card",
    title: "Card controls",
    text: "Freeze or unfreeze supported cards and review card activity when needed.",
  },
  {
    icon: "fa-key",
    title: "Phishing awareness",
    text: "We never ask for your password by email. Report unexpected messages to support.",
  },
];

export function SecuritySection() {
  return (
    <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center space-x-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            <i className="fas fa-shield-alt" />
            <span>Account security</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
            Security controls you can use
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-slate-600">
            These are the safeguards available in your account. No online service can guarantee
            absolute security, so keep your credentials private and report anything unusual.
          </p>
        </div>
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {controls.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 shadow-lg">
                <i className={`fas ${item.icon} text-2xl text-white`} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="leading-relaxed text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="rounded-3xl bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-white">
          <div className="mb-8 text-center">
            <h3 className="mb-4 text-2xl font-bold">Protect your account</h3>
            <p className="text-slate-300">Simple habits that make a difference</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/10">
                <i className="fas fa-key text-2xl text-white" />
              </div>
              <h4 className="mb-2 font-semibold">Use a unique password</h4>
              <p className="text-sm text-slate-300">
                Do not reuse the password you use for other websites.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/10">
                <i className="fas fa-link text-2xl text-white" />
              </div>
              <h4 className="mb-2 font-semibold">Check links before signing in</h4>
              <p className="text-sm text-slate-300">
                Confirm the address in your browser before entering credentials.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/10">
                <i className="fas fa-sync text-2xl text-white" />
              </div>
              <h4 className="mb-2 font-semibold">Keep your devices updated</h4>
              <p className="text-sm text-slate-300">
                Install security updates for your browser and operating system.
              </p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-800 transition-colors hover:bg-slate-100"
            >
              <i className="fas fa-headset mr-2" />
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
