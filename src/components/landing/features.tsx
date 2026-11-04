import Link from "@/lib/next/link";

const features = [
  {
    icon: "fa-mobile-alt",
    title: "Account dashboard",
    text: "Review balances, account details, and recent activity from a responsive dashboard.",
    points: ["Account overview", "Recent activity", "Mobile-friendly layout"],
    color: "from-blue-500 to-blue-600",
    textColor: "text-blue-600",
    hover: "hover:text-blue-700",
  },
  {
    icon: "fa-shield-alt",
    title: "Account security",
    text: "Use available security controls to help protect access to your account.",
    points: ["Optional two-factor authentication", "Session review", "Password controls"],
    color: "from-green-500 to-green-600",
    textColor: "text-green-600",
    hover: "hover:text-green-700",
  },
  {
    icon: "fa-chart-line",
    title: "Activity history",
    text: "Filter and review transaction history, then export a statement when needed.",
    points: ["Transaction history", "Search and filters", "Statement export"],
    color: "from-purple-500 to-purple-600",
    textColor: "text-purple-600",
    hover: "hover:text-purple-700",
  },
  {
    icon: "fa-headset",
    title: "Support inbox",
    text: "Contact support from your account and keep replies organized in one place.",
    points: ["Support requests", "Reply history", "Contact form"],
    color: "from-orange-500 to-orange-600",
    textColor: "text-orange-600",
    hover: "hover:text-orange-700",
  },
  {
    icon: "fa-arrow-right-arrow-left",
    title: "Transfer tools",
    text: "Move money between accounts and follow the status of your transfers.",
    points: ["Account transfers", "Transfer history", "Status updates"],
    color: "from-teal-500 to-teal-600",
    textColor: "text-teal-600",
    hover: "hover:text-teal-700",
  },
  {
    icon: "fa-credit-card",
    title: "Card controls",
    text: "Review supported cards and use available freeze and unfreeze controls.",
    points: ["Card overview", "Freeze controls", "Card activity"],
    color: "from-rose-500 to-rose-600",
    textColor: "text-rose-600",
    hover: "hover:text-rose-700",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center space-x-2 rounded-full border border-teal-200 bg-gradient-to-r from-blue-100 to-teal-100 px-4 py-2 text-sm font-semibold text-teal-700">
            <i className="fas fa-sparkles" />
            <span>Account features</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
            Everything in one dashboard
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-slate-600">
            Common account tasks are grouped together so you can find them quickly.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-lg transition-all duration-300 hover:border-blue-300 hover:shadow-xl"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-blue-600/20 blur-xl transition-all duration-300" />
                <div className={`relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-r ${feature.color} shadow-lg`}>
                  <i className={`fas ${feature.icon} text-2xl text-white`} />
                </div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
              <p className="mb-4 leading-relaxed text-slate-600">{feature.text}</p>
              <ul className="space-y-2 text-sm text-slate-600">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-center">
                    <i className={`fas fa-check mr-2 ${feature.textColor}`} />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-slate-100 pt-6">
                <Link
                  href="/auth/register"
                  className={`inline-flex items-center font-semibold transition-colors ${feature.textColor} ${feature.hover}`}
                >
                  Open an account <i className="fas fa-arrow-right ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <div className="rounded-3xl border border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 p-8">
            <h3 className="mb-4 text-2xl font-bold text-white">Ready to see your account?</h3>
            <p className="mx-auto mb-6 max-w-2xl text-slate-300">
              Sign in to review the features available for your account.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-teal-700 hover:shadow-xl"
            >
              <i className="fas fa-sign-in-alt mr-2" /> Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
