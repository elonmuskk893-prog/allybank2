const items = [
  {
    icon: "fa-wallet",
    title: "Account dashboard",
    text: "View balances, account details, and recent activity in one place.",
    color: "from-blue-500 to-blue-600",
    tint: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: "fa-arrow-right-arrow-left",
    title: "Transfer tools",
    text: "Send money between accounts and track transfer status from your dashboard.",
    color: "from-green-500 to-green-600",
    tint: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: "fa-credit-card",
    title: "Card management",
    text: "Review supported cards and use available freeze and unfreeze controls.",
    color: "from-purple-500 to-purple-600",
    tint: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: "fa-headset",
    title: "Support inbox",
    text: "Contact support and keep replies organized in your account.",
    color: "from-orange-500 to-orange-600",
    tint: "bg-orange-100",
    iconColor: "text-orange-600",
  },
];

export function Stats() {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center space-x-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            <i className="fas fa-chart-line" />
            <span>Account tools</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
            Manage your account in one place
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-slate-600">
            Use the dashboard to review activity, move money, and reach support.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
              <div className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl ${item.tint}`}>
                <i className={`fas ${item.icon} text-xl ${item.iconColor}`} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
