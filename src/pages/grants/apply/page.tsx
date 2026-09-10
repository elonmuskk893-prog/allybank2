"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/lib/next/link";
import { useRouter } from "@/lib/next/navigation";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { bankFetch } from "@/lib/api";

interface GrantProgram {
  id: string;
  title: string;
  description: string;
  icon: string;
  tint: string;
  bullets: string[];
  max_amount: number | string | null;
}

type Applicant = "individual" | "company";

export default function GrantApplyPage() {
  return (
    <AppShell>
      <GrantApplyContent />
    </AppShell>
  );
}

function GrantApplyContent() {
  const { site } = useMe();
  const router = useRouter();
  const currency = site.primary_currency;

  const [programs, setPrograms] = useState<GrantProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicant, setApplicant] = useState<Applicant>("individual");
  const [programId, setProgramId] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#company") {
      setApplicant("company");
    }
    (async () => {
      const res = await bankFetch<{ programs: GrantProgram[] }>("/grant-programs");
      if (res.ok && res.data?.programs) {
        setPrograms(res.data.programs);
        setProgramId((current) => current || (res.data!.programs[0]?.id ?? ""));
      }
      setLoading(false);
    })();
  }, []);

  const selected = useMemo(
    () => programs.find((program) => program.id === programId) ?? null,
    [programs, programId],
  );
  const maxAmount = selected?.max_amount != null ? Number(selected.max_amount) : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    const value = Number(amount.replace(/[^0-9.]/g, ""));
    if (!value || value <= 0) {
      setError("Enter the amount you would like to request.");
      return;
    }
    if (maxAmount && value > maxAmount) {
      setError(`The maximum for this program is ${maxAmount.toLocaleString()} ${currency}.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    const res = await bankFetch("/grants", {
      method: "POST",
      body: {
        program: `${selected.title} \u00b7 ${applicant === "company" ? "Company" : "Individual"}${
          purpose.trim() ? ` \u00b7 ${purpose.trim().slice(0, 140)}` : ""
        }`,
        amount: value,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "We couldn't submit your application. Please try again.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/grants"), 1400);
  };

  return (
    <div className="-mx-4 -my-5 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 lg:-mx-6 lg:p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Grant Application</h1>
          <Link href="/grants" className="text-sm text-gray-600 hover:underline dark:text-gray-300">
            Back
          </Link>
        </div>

        {done ? (
          <div className="rounded-xl border border-green-200/60 bg-green-50/80 p-6 text-center dark:border-green-700/50 dark:bg-green-900/20">
            <i className="fas fa-check-circle mb-2 text-2xl text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Application submitted
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Our team will review it and update the status on your Grants page.
            </p>
          </div>
        ) : loading ? (
          <div className="rounded-xl border border-white/20 bg-white/95 p-8 text-center text-sm text-gray-500 dark:border-gray-700/50 dark:bg-gray-800/95">
            Loading available programs…
          </div>
        ) : programs.length === 0 ? (
          <div className="rounded-xl border border-white/20 bg-white/95 p-8 text-center dark:border-gray-700/50 dark:bg-gray-800/95">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              No grant programs are open right now
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Please check back soon — new programs are announced regularly.
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-5 rounded-xl border border-white/20 bg-white/95 p-4 shadow-sm backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95 lg:p-6"
          >
            <div>
              <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Applying as
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["individual", "company"] as Applicant[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setApplicant(option)}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium capitalize transition ${
                      applicant === option
                        ? "border-transparent text-white shadow-sm"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/60"
                    }`}
                    style={applicant === option ? { background: "var(--brand)" } : undefined}
                  >
                    <i
                      className={`fas ${option === "company" ? "fa-building" : "fa-user"} mr-2 text-xs`}
                    />
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="grant-program"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                Grant program
              </label>
              <select
                id="grant-program"
                value={programId}
                onChange={(event) => setProgramId(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
              {selected && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                  <p>{selected.description}</p>
                  {selected.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {selected.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2 text-xs">
                          <i className="fas fa-check mt-0.5 text-green-600 dark:text-green-400" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {maxAmount != null && (
                    <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-200">
                      Maximum: {maxAmount.toLocaleString()} {currency}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="grant-amount"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                Amount requested ({currency})
              </label>
              <input
                id="grant-amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="grant-purpose"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                What will the funds be used for?
              </label>
              <textarea
                id="grant-purpose"
                rows={3}
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                maxLength={140}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--brand)" }}
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
