import Link from "@/lib/next/link";

const STEPS = [
  {
    n: "1",
    title: "Create an Account",
    body: "Register with your name, email and a password.",
    icon: "fa-user-plus",
    note: "Start online",
  },
  {
    n: "2",
    title: "Verify Your Email",
    body: "Confirm your email address to secure your account.",
    icon: "fa-envelope-circle-check",
    note: "Email verification",
  },
  {
    n: "3",
    title: "Complete Verification",
    body: "If required, submit identity details for review.",
    icon: "fa-id-card",
    note: "KYC may apply",
  },
  {
    n: "4",
    title: "Use Your Account",
    body: "Review your dashboard, deposit methods and available features.",
    icon: "fa-gauge-high",
    note: "Features vary",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center space-x-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            <i className="fas fa-route" />
            <span>Getting Started</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
            How Account Registration Works
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-slate-600">
            Registration and verification requirements depend on the features you use.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center">
                <div className="mr-4 grid h-12 w-12 place-items-center rounded-xl bg-blue-100">
                  <i className={`fas ${step.icon} text-xl text-blue-600`} />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Step {step.n}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                </div>
              </div>
              <p className="leading-relaxed text-slate-600">{step.body}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-blue-600">
                <i className="fas fa-circle-info mr-2" />
                {step.note}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-green-100">
                <i className="fas fa-lock text-2xl text-green-600" />
              </div>
              <h4 className="mb-2 font-bold text-slate-900">Secure Sign-In</h4>
              <p className="text-sm text-slate-600">Passwords are hashed and sessions are protected.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-blue-100">
                <i className="fas fa-mobile-screen text-2xl text-blue-600" />
              </div>
              <h4 className="mb-2 font-bold text-slate-900">Any Device</h4>
              <p className="text-sm text-slate-600">Use the dashboard from a modern desktop or mobile browser.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-purple-100">
                <i className="fas fa-headset text-2xl text-purple-600" />
              </div>
              <h4 className="mb-2 font-bold text-slate-900">Support</h4>
              <p className="text-sm text-slate-600">Contact support when you need help with your account.</p>
            </div>
          </div>
        </div>
        <div className="mt-12 text-center">
          <h3 className="mb-4 text-2xl font-bold text-slate-900">Need an account?</h3>
          <p className="mx-auto mb-6 max-w-2xl text-slate-600">
            Review the registration requirements and create an account to continue.
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
              <i className="fas fa-question-circle mr-2" /> Contact Support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
