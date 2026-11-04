import Link from "@/lib/next/link";

const PRODUCTS = [
  {
    icon: "fa-gauge-high",
    title: "Account Dashboard",
    body: "Review balances, recent activity and account details in one place.",
    points: ["Balance overview", "Recent transactions", "Account status"],
    href: "/services/personal",
    cta: "Personal Accounts",
  },
  {
    icon: "fa-building",
    title: "Business Tools",
    body: "Manage account activity, beneficiaries and transfers for a business account.",
    points: ["Beneficiary list", "Transfer status", "Statement export"],
    href: "/services/business",
    cta: "Business Accounts",
  },
  {
    icon: "fa-credit-card",
    title: "Card Controls",
    body: "Review supported cards and use the controls available on your account.",
    points: ["Card overview", "Freeze controls", "Card activity"],
    href: "/services/cards",
    cta: "Card Management",
  },
] as const;

export function Products() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center space-x-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            <i className="fas fa-layer-group" />
            <span>Account Tools</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
            What You Can Manage
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-slate-600">
            Available features depend on your account, verification and region.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {PRODUCTS.map((product) => (
            <div
              key={product.title}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-blue-100">
                <i className={`fas ${product.icon} text-2xl text-blue-600`} />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-slate-900">{product.title}</h3>
              <p className="mb-6 text-slate-600">{product.body}</p>
              <ul className="mb-6 space-y-2 text-sm text-slate-600">
                {product.points.map((point) => (
                  <li key={point} className="flex items-center">
                    <i className="fas fa-check mr-2 text-green-500" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href={product.href}
                className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-700"
              >
                {product.cta}
                <i className="fas fa-arrow-right ml-2" />
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-16 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-100 to-blue-100 p-8 text-center">
          <h3 className="mb-4 text-2xl font-bold text-slate-900">Compare Account Features</h3>
          <p className="mx-auto mb-6 max-w-2xl text-slate-600">
            Review the current features and requirements before creating an account.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-teal-700"
            >
              <i className="fas fa-user-plus mr-2" /> Create Account
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-xl border-2 border-slate-300 bg-white px-8 py-4 font-semibold text-slate-700 transition-all duration-300 hover:border-slate-400"
            >
              <i className="fas fa-headset mr-2" /> Contact Support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
