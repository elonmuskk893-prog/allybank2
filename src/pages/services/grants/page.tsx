"use client";

import { useEffect, useState } from "react";
import Link from "@/lib/next/link";
import { PublicLayout } from "@/components/landing/public-layout";

const TINTS = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    iconFg: "text-blue-600 dark:text-blue-400",
    link: "text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    iconFg: "text-purple-600 dark:text-purple-400",
    link: "text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 transition-colors",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    iconFg: "text-green-600 dark:text-green-400",
    link: "text-green-600 dark:text-green-400 font-semibold hover:text-green-700 dark:hover:text-green-300 transition-colors",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    iconFg: "text-red-600 dark:text-red-400",
    link: "text-red-600 dark:text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300 transition-colors",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    iconFg: "text-orange-600 dark:text-orange-400",
    link: "text-orange-600 dark:text-orange-400 font-semibold hover:text-orange-700 dark:hover:text-orange-300 transition-colors",
  },
  teal: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    iconFg: "text-teal-600 dark:text-teal-400",
    link: "text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors",
  },
} as const;

type TintKey = keyof typeof TINTS;

interface GrantProgram {
  id: string;
  title: string;
  description: string;
  icon: string;
  tint: string;
  bullets: string[];
}

const STEPS = [
  {
    n: "1",
    title: "Review Programs",
    body: "Open a program to review its current eligibility criteria",
  },
  {
    n: "2",
    title: "Submit Application",
    body: "Provide the requested information and documents",
  },
  {
    n: "3",
    title: "Review Process",
    body: "Review timelines vary by program and application volume",
  },
  {
    n: "4",
    title: "Status Updates",
    body: "Track the decision and any next steps in your account",
  },
] as const;

export default function GrantsServicesPage() {
  // Programs are managed in Admin → Grants → Programs; enabling, editing or
  // disabling one there changes this list immediately.
  const [programs, setPrograms] = useState<GrantProgram[] | null>(null);

  useEffect(() => {
    fetch("/api/banking-public/grant-programs")
      .then((r) => r.json())
      .then((json) => setPrograms((json?.data?.programs as GrantProgram[]) ?? []))
      .catch(() => setPrograms([]));
  }, []);

  const cards: GrantProgram[] = programs ?? [];

  return (
    <PublicLayout>
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
            <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-semibold mb-6 border border-white/20">
                <i className="fa-solid fa-hand-holding-dollar mr-2" />
                Financial Assistance
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                Grants &amp; Financial Aid
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Review any financial assistance programs currently offered by this platform. Availability and eligibility vary.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Financial Assistance Programs
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Only programs enabled by an administrator are shown here. Programs may change or close.
              </p>
            </div>
            {cards.length === 0 ? (
              <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="text-gray-600 dark:text-gray-300">
                  No financial assistance programs are open right now.
                </p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cards.map((e) => {
                const t = TINTS[e.tint as TintKey] ?? TINTS.blue;
                return (
                  <div
                    key={e.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className={`w-16 h-16 ${t.bg} rounded-2xl flex items-center justify-center mb-6`}>
                      <i className={`${e.icon} text-2xl ${t.iconFg}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {e.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{e.description}</p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                      {e.bullets.map((item) => (
                        <li key={item} className="flex items-center">
                          <i className="fa-solid fa-check text-green-500 mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <a href="#apply" className={`inline-flex items-center ${t.link}`}>
                      Learn More <i className="fa-solid fa-arrow-right ml-2" />
                    </a>
                  </div>
                );
              })}
            </div>
            )}
            <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-gray-500 dark:text-gray-400">
              Submitting an application does not guarantee approval or funding. This platform is not a government agency.
            </p>
          </div>
        </section>

        <section id="apply" className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                How to Apply
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                What to expect when a program is open
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {STEPS.map((e) => (
                <div key={e.n} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {e.n}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {e.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{e.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-blue-600 dark:bg-blue-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Check Available Programs
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Review the current programs and eligibility details before applying
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/grants"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <i className="fa-solid fa-file-alt mr-3" />
                View My Applications
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-2xl transition-all duration-300 border-2 border-white/30"
              >
                <i className="fa-solid fa-phone mr-3" />
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </>
    </PublicLayout>
  );
}