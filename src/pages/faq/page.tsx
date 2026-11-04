"use client";

import { useEffect, useState } from "react";
import Link from "@/lib/next/link";
import { PublicLayout } from "@/components/landing/public-layout";
import { useSite } from "@/lib/use-site";

interface FaqEntry {
  q: string;
  a: string;
}

function FaqItem({
  item,
  index,
  open,
  onToggle,
}: {
  item: FaqEntry;
  index: number;
  open: number | null;
  onToggle: (index: number | null) => void;
}) {
  const isOpen = open === index;
  return (
    <div className="border border-border dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(isOpen ? null : index)}
        className="flex justify-between items-center w-full px-6 py-4 text-left bg-card dark:bg-gray-800 hover:bg-muted/30 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
      >
        <span className="font-medium text-foreground dark:text-white">{item.q}</span>
        <i
          className="fa-solid fa-chevron-down h-5 w-5 text-muted-foreground dark:text-gray-400 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-muted-foreground dark:text-gray-300">
          <p>{item.a}</p>
        </div>
      )}
    </div>
  );
}

function FaqSection({
  icon,
  iconBg,
  iconFg,
  title,
  items,
}: {
  icon: string;
  iconBg: string;
  iconFg: string;
  title: string;
  items: FaqEntry[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8 border border-border dark:border-gray-700">
      <div className="p-6 md:p-8">
        <div className="flex items-center mb-6">
          <div
            className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center ${iconFg} mr-4`}
          >
            <i className={`fa-solid ${icon} text-2xl`} />
          </div>
          <h3 className="text-2xl font-bold text-foreground dark:text-white">{title}</h3>
        </div>
        <div className="space-y-6">
          {items.map((item, idx) => (
            <FaqItem key={idx} item={item} index={idx} open={open} onToggle={setOpen} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FaqContent() {
  const { site } = useSite();
  const name = site?.name ?? "Account Dashboard";
  const [active, setActive] = useState("general");
  const [managedFaqs, setManagedFaqs] = useState<FaqEntry[]>([]);

  // Admin-managed FAQs (Settings → FAQ) are shown first.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/banking-public/faqs");
        const json = (await res.json()) as {
          data?: { faqs?: { question: string; answer: string }[] };
        };
        const faqs = json.data?.faqs ?? [];
        setManagedFaqs(faqs.map((f) => ({ q: f.question, a: f.answer })));
      } catch {
        // Keep the built-in sections if the API is unavailable.
      }
    })();
  }, []);

  const aboutItems: FaqEntry[] = [
    {
      q: `WHAT IS ${name}?`,
      a: `${name} is an online account dashboard for managing deposits, withdrawals, cards and account activity. It is not a bank, investment adviser or government agency.`,
    },
    {
      q: `IS ${name} A REGISTERED BANK?`,
      a: "No. This service does not claim to be a bank and is not insured by any government deposit insurance program. Contact support for details about the operator of this site.",
    },
    {
      q: "WHICH COUNTRIES ARE SUPPORTED?",
      a: "Available features vary by location and by the payment providers that are currently enabled. Check the Deposit and Withdraw pages for the options available to you.",
    },
  ];

  const depositItems: FaqEntry[] = [
    {
      q: "HOW DO I ADD MONEY TO MY ACCOUNT?",
      a: "Open the Deposit page and use one of the payment methods currently shown. Any fee is displayed before you confirm the transaction.",
    },
    {
      q: "WILL MY BALANCE EARN A FIXED RETURN?",
      a: "No fixed return is promised. Products that display a rate show the applicable terms in the app, and rates may change.",
    },
  ];

  return (
    <>
      <section className="relative py-24 lg:py-32 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-950 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -right-20 top-20 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl animate-bounce"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute left-1/4 top-1/3 w-80 h-80 bg-blue-400 rounded-full opacity-10 blur-3xl"
            style={{ animation: "pulse 4s ease-in-out infinite" }}
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h1>
            <nav className="flex justify-center" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-blue-100 dark:text-blue-200">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right h-4 w-4 mx-1" />
                </li>
                <li className="text-white font-medium">FAQ</li>
              </ol>
            </nav>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-background dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-4">
              HELP CENTER
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white mb-6">
              Find Answers to Your Questions
            </h2>
            <p className="text-lg text-muted-foreground dark:text-gray-300">
              Browse the FAQ for answers about accounts, verification and available features.
            </p>
          </div>
          <div className="space-y-8">
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[
                { key: "general", label: "General" },
                { key: "about", label: "About Us" },
                { key: "account", label: "My Account" },
                { key: "deposit", label: "Deposit" },
                { key: "withdrawal", label: "Withdrawal of Funds" },
                { key: "referral", label: "Referral Program" },
                { key: "additional", label: "Additional Questions" },
              ].map((e) => (
                <button
                  key={e.key}
                  type="button"
                  onClick={() => setActive(e.key)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    active === e.key
                      ? "bg-blue-600 text-white dark:bg-blue-700 dark:text-white"
                      : "bg-muted dark:bg-gray-700 text-muted-foreground dark:text-gray-300 hover:bg-muted/70 dark:hover:bg-gray-600"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
            {"general" === active && managedFaqs.length > 0 && (
              <FaqSection
                icon="fa-circle-info"
                iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                iconFg="text-emerald-600 dark:text-emerald-400"
                title="General"
                items={managedFaqs}
              />
            )}
            {"about" === active && (
              <FaqSection
                icon="fa-building"
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                iconFg="text-blue-600 dark:text-blue-400"
                title="About Us"
                items={aboutItems}
              />
            )}
            {"account" === active && (
              <FaqSection
                icon="fa-user"
                iconBg="bg-secondary-100 dark:bg-secondary-900/30"
                iconFg="text-secondary-600 dark:text-secondary-400"
                title="My Account"
                items={[
                  {
                    q: "HOW MANY ACCOUNTS CAN I OPEN?",
                    a: "Each person may maintain one account. Contact support if you need help with an existing account.",
                  },
                  {
                    q: "WHAT INFORMATION DO I NEED TO PROVIDE?",
                    a: "Registration requires your name, email and password. Identity verification may require a government-issued ID, depending on the features you use.",
                  },
                  {
                    q: "ARE THERE ACCOUNT FEES?",
                    a: "Any applicable fee is shown before you confirm a transaction. Review the confirmation screen before submitting.",
                  },
                ]}
              />
            )}
            {"deposit" === active && (
              <FaqSection
                icon="fa-wallet"
                iconBg="bg-accent-100 dark:bg-accent-900/30"
                iconFg="text-accent-600 dark:text-accent-400"
                title="Deposit"
                items={depositItems}
              />
            )}
            {"withdrawal" === active && (
              <FaqSection
                icon="fa-credit-card"
                iconBg="bg-green-100 dark:bg-green-900/30"
                iconFg="text-green-600 dark:text-green-400"
                title="Withdrawal of Funds"
                items={[
                  {
                    q: "HOW LONG DOES A WITHDRAWAL TAKE?",
                    a: "Withdrawals are reviewed before processing. The estimated timing for your selected method is shown before you submit the request.",
                  },
                ]}
              />
            )}
            {"referral" === active && (
              <FaqSection
                icon="fa-users"
                iconBg="bg-yellow-100 dark:bg-yellow-900/30"
                iconFg="text-yellow-600 dark:text-yellow-400"
                title="Referral Program"
                items={[
                  {
                    q: "DO YOU OFFER A REFERRAL PROGRAM?",
                    a: "If a referral program is available, its current terms and any rewards are shown on the Referrals page. Rewards are not guaranteed.",
                  },
                ]}
              />
            )}
            {"additional" === active && (
              <FaqSection
                icon="fa-circle-question"
                iconBg="bg-purple-100 dark:bg-purple-900/30"
                iconFg="text-purple-600 dark:text-purple-400"
                title="Additional Questions"
                items={[
                  {
                    q: "WHERE CAN I EXCHANGE ONE CURRENCY FOR ANOTHER?",
                    a: "Use the Currency Swap page to see the currencies and rates currently available in your account.",
                  },
                ]}
              />
            )}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30 dark:bg-gray-800/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-4">
              NEED MORE HELP?
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white mb-6">
              {"Can't Find What You're Looking For?"}
            </h2>
            <p className="text-lg text-muted-foreground dark:text-gray-300 mb-8">
              {
                "If you couldn't find the answer to your question in our FAQ, please don't hesitate to contact our support team."
              }
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Contact Support
              <i className="fa-solid fa-arrow-right-long ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Page() {
  return (
    <PublicLayout>
      <FaqContent />
    </PublicLayout>
  );
}
