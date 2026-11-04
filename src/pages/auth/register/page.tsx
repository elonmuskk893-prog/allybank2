"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/next/navigation";
import Link from "@/lib/next/link";
import { AuthLayout, type AuthPanelContent } from "@/components/auth/auth-layout";
import { bankFetch } from "@/lib/api";
import { useSite } from "@/lib/use-site";

const REGISTER_FEATURES: AuthPanelContent["features"] = [
  { icon: "fas fa-shield-alt", title: "Secure Platform", sub: "Account protection" },
  { icon: "fas fa-bolt", title: "Transfers", sub: "Status tracking" },
  { icon: "fas fa-clock", title: "Online Access", sub: "Modern browser" },
  { icon: "fas fa-globe", title: "Online Account", sub: "Browser access" },
];

const STEPS = [
  {
    key: "Personal",
    icon: "fa-user",
    title: "Personal Information",
    sub: "Tell us about yourself",
  },
  {
    key: "Contact",
    icon: "fa-envelope",
    title: "Contact Information",
    sub: "How can we reach you",
  },
  {
    key: "Account",
    icon: "fa-building-columns",
    title: "Account Setup",
    sub: "Configure your account",
  },
  { key: "Security", icon: "fa-shield-halved", title: "Security", sub: "Secure your account" },
];

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-300/50 bg-gray-50/50 py-3 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:ring-2 dark:border-gray-600/50 dark:bg-gray-700/50 dark:text-gray-100";
const LABEL_CLASS = "mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300";
const RING_STYLE = { "--tw-ring-color": "var(--brand)" } as React.CSSProperties;

interface RegisterResponse {
  needs_email_verification?: boolean;
}

function RegisterForm() {
  const router = useRouter();
  const { site } = useSite();
  const siteName = site?.name ?? "Account Dashboard";
  const currency = site?.primary_currency ?? "USD";
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref")?.trim() ?? "";

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    lastname: "",
    middlename: "",
    username: "",
    email: "",
    phone: "",
    country: "",
    curr: currency,
    accounttype: "Savings",
    pin: "",
    password: "",
    password_confirmation: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function submit() {
    setError(null);
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.password_confirmation) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please accept the terms to continue.");
      return;
    }
    setLoading(true);
    const result = await bankFetch<RegisterResponse>("/auth/register", {
      method: "POST",
      body: {
        email: form.email.trim(),
        password: form.password,
        first_name: form.name.trim(),
        last_name: form.lastname.trim(),
        phone: form.phone || undefined,
        ...(form.pin ? { pin: form.pin } : {}),
        ...(refCode ? { ref_code: refCode } : {}),
      },
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    router.replace(
      result.data?.needs_email_verification ? "/auth/verify-email" : "/auth/login?registered=1",
    );
  }

  function next() {
    setError(null);
    if (step === 0) {
      if (!form.name.trim() || !form.lastname.trim() || !form.username.trim()) {
        setError("Fill in your name and username.");
        return;
      }
    }
    if (step === 1) {
      if (!form.email.trim()) {
        setError("Enter your email address.");
        return;
      }
    }
    setStep((s) => Math.min(3, s + 1));
  }

  const iconLeft = (icon: string) => (
    <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-gray-400">
      <i className={`fas ${icon} text-sm`} />
    </span>
  );

  const panel = STEPS[step];

  return (
    <AuthLayout
      left={{
        title: `Join ${siteName}`,
        subtitle: "Create Your Account",
        desc: `Start your financial journey with ${siteName}. Review account features and requirements before you sign up.`,
        features: REGISTER_FEATURES,
      }}
      rightMax="max-w-md"
    >
      <div className="overflow-hidden rounded-2xl border border-gray-200/50 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/90">
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Account</h2>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Step {step + 1} of 4
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${((step + 1) / 4) * 100}%`, background: "var(--brand)" }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-4">
            {STEPS.map((s, index) => {
              const active = index === step;
              const done = index < step;
              return (
                <div key={s.key} className="flex flex-col items-center gap-1">
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-full text-xs ${active || done ? "text-white" : "bg-gray-100 text-gray-400 dark:bg-gray-700"}`}
                    style={active || done ? { background: "var(--brand)" } : undefined}
                  >
                    <i className={`fa-solid ${done ? "fa-check" : s.icon}`} />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${active ? "" : "text-gray-500 dark:text-gray-400"}`}
                    style={active ? { color: "var(--brand)" } : undefined}
                  >
                    {s.key}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          <div className="mb-4 text-center">
            <div
              className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl"
              style={{ background: "color-mix(in srgb, var(--brand) 14%, transparent)" }}
            >
              <i className={`fa-solid ${panel.icon} text-lg`} style={{ color: "var(--brand)" }} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{panel.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{panel.sub}</p>
          </div>

          <div className="space-y-3">
            {step === 0 && (
              <>
                <div>
                  <label className={LABEL_CLASS}>First Name *</label>
                  <div className="relative">
                    {iconLeft("fa-user")}
                    <input
                      value={form.name}
                      onChange={update("name")}
                      placeholder="John"
                      className={INPUT_CLASS}
                      style={RING_STYLE}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Last Name *</label>
                  <div className="relative">
                    {iconLeft("fa-user")}
                    <input
                      value={form.lastname}
                      onChange={update("lastname")}
                      placeholder="Smith"
                      className={INPUT_CLASS}
                      style={RING_STYLE}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Middle Name</label>
                  <div className="relative">
                    {iconLeft("fa-user")}
                    <input
                      value={form.middlename}
                      onChange={update("middlename")}
                      placeholder="David"
                      className={INPUT_CLASS}
                      style={RING_STYLE}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Username *</label>
                  <div className="relative">
                    {iconLeft("fa-at")}
                    <input
                      value={form.username}
                      onChange={update("username")}
                      placeholder="johnsmith123"
                      className={INPUT_CLASS}
                      style={RING_STYLE}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className={LABEL_CLASS}>Email Address *</label>
                  <div className="relative">
                    {iconLeft("fa-envelope")}
                    <input
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      placeholder="you@example.com"
                      className={INPUT_CLASS}
                      style={RING_STYLE}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Phone Number</label>
                  <div className="relative">
                    {iconLeft("fa-phone")}
                    <input
                      value={form.phone}
                      onChange={update("phone")}
                      placeholder="+1 555 000 0000"
                      className={INPUT_CLASS}
                      style={RING_STYLE}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Country</label>
                  <div className="relative">
                    {iconLeft("fa-globe")}
                    <input
                      value={form.country}
                      onChange={update("country")}
                      placeholder="United States"
                      className={INPUT_CLASS}
                      style={RING_STYLE}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className={LABEL_CLASS}>Account Currency</label>
                  <div className="relative">
                    {iconLeft("fa-coins")}
                    <input
                      value={form.curr}
                      onChange={update("curr")}
                      className={INPUT_CLASS}
                      style={RING_STYLE}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Account Type</label>
                  <div className="relative">
                    {iconLeft("fa-building-columns")}
                    <select
                      value={form.accounttype}
                      onChange={update("accounttype")}
                      className={INPUT_CLASS}
                      style={RING_STYLE}
                    >
                      <option>Savings</option>
                      <option>Checking</option>
                      <option>Business</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Transaction PIN</label>
                  <div className="relative">
                    {iconLeft("fa-key")}
                    <input
                      type="password"
                      inputMode="numeric"
                      value={form.pin}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          pin: e.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      placeholder="4-6 digits"
                      className={INPUT_CLASS}
                      style={RING_STYLE}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <label className={LABEL_CLASS}>Password *</label>
                  <div className="relative">
                    {iconLeft("fa-lock")}
                    <input
                      type="password"
                      value={form.password}
                      onChange={update("password")}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className={INPUT_CLASS}
                      style={RING_STYLE}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Confirm Password *</label>
                  <div className="relative">
                    {iconLeft("fa-lock")}
                    <input
                      type="password"
                      value={form.password_confirmation}
                      onChange={update("password_confirmation")}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      className={INPUT_CLASS}
                      style={RING_STYLE}
                    />
                  </div>
                </div>
                <label className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5"
                    style={{ accentColor: "var(--brand)" }}
                  />
                  I agree to the Terms of Service and Privacy Policy.
                </label>
              </>
            )}
          </div>

          {error && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>}

          <div className="mt-5 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep((s) => s - 1);
                }}
                className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <i className="fas fa-chevron-left mr-1.5 text-xs" />
                Back
              </button>
            ) : (
              <span />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                Next
                <i className="fas fa-chevron-right ml-1.5 text-xs" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--brand)" }}
              >
                {loading ? (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <i className="fas fa-user-plus mr-2 text-xs" />
                )}
                Create Account
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold hover:opacity-80"
              style={{ color: "var(--brand)" }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
