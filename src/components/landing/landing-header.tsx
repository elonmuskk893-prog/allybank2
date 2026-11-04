"use client";

import Link from "@/lib/next/link";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { useSite } from "@/lib/use-site";

const NAV = [
  { label: "Home", href: "/", icon: "fa-home" },
  { label: "About", href: "/about", icon: "fa-info-circle" },
  { label: "Contact", href: "/contact", icon: "fa-headset" },
];

const SERVICES = [
  {
    label: "Personal Accounts",
    icon: "fa-user",
    color: "text-sky-500",
    href: "/services/personal",
  },
  {
    label: "Business Accounts",
    icon: "fa-briefcase",
    color: "text-blue-500",
    href: "/services/business",
  },
  {
    label: "Loans & Credit",
    icon: "fa-handshake",
    color: "text-green-500",
    href: "/services/loans",
  },
  { label: "Cards", icon: "fa-credit-card", color: "text-purple-500", href: "/services/cards" },
  {
    label: "Grants & Aid",
    icon: "fa-hand-holding-dollar",
    color: "text-orange-500",
    href: "/services/grants",
  },
];

const NAV_LINKS = [...NAV, ...SERVICES];

export function LandingHeader() {
  const { theme, toggleTheme } = useTheme();
  const { site } = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const brandName = site?.name ?? "Account Dashboard";
  const brandInitial = brandName.slice(0, 1).toUpperCase();

  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 bg-gradient-to-r from-white via-slate-50 to-white shadow-lg backdrop-blur-xl dark:border-white/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-10 -top-10 h-20 w-20 animate-pulse rounded-full blur-xl"
          style={{ background: "#0ea5e922" }}
        />
        <div
          className="absolute right-1/4 -top-5 h-16 w-16 animate-pulse rounded-full blur-lg"
          style={{ background: "#14b8a622", animationDelay: "1s" }}
        />
        <div
          className="absolute -bottom-10 -right-10 h-24 w-24 animate-pulse rounded-full blur-xl"
          style={{ background: "#a855f722", animationDelay: "2s" }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-[4.5rem]">
          <Link href="/" className="group flex items-center">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-lg transition-all duration-300"
                style={{ background: "#0ea5e933" }}
              />
              <span
                className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full text-lg font-bold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #0ea5e9, color-mix(in srgb, #0ea5e9 70%, #000))",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- platform logo asset */}
                <img
                  src={site?.logo_url || "/logo.jpeg"}
                  alt={brandName}
                  className="h-full w-full object-cover"
                />
              </span>
            </div>
            <span className="ml-2 text-lg font-bold tracking-tight">{brandName}</span>
          </Link>

          <div className="hidden items-center space-x-1 lg:flex">
            <Link
              href="/"
              className="group relative px-4 py-2 font-medium text-gray-700 transition-all hover:text-[var(--brand)] dark:text-gray-300"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="group relative px-4 py-2 font-medium text-gray-700 transition-all hover:text-[var(--brand)] dark:text-gray-300"
            >
              About
            </Link>

            <div className="group relative">
              <button className="flex items-center px-4 py-2 font-medium text-gray-700 transition-all hover:text-[var(--brand)] dark:text-gray-300">
                Services{" "}
                <i className="fa-solid fa-chevron-down ml-1 text-xs transition-transform duration-300 group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-gray-200 bg-white opacity-0 shadow-2xl transition-all duration-300 group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800">
                <div className="p-2">
                  {SERVICES.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center rounded-xl px-4 py-3 text-gray-700 transition-all hover:bg-gray-50 hover:text-[var(--brand)] dark:text-gray-300 dark:hover:bg-gray-700/50"
                    >
                      <i className={`fa-solid ${item.icon} ${item.color} mr-3 w-5 text-center`} />{" "}
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/contact"
              className="group relative px-4 py-2 font-medium text-gray-700 transition-all hover:text-[var(--brand)] dark:text-gray-300"
            >
              Contact
            </Link>
          </div>

          <div className="hidden items-center space-x-3 lg:flex">
            <button
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:from-gray-800 dark:to-gray-700 dark:text-gray-300"
            >
              <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} text-lg`} />
            </button>
            <Link
              href="/auth/login"
              className="px-4 py-2.5 font-semibold text-[var(--brand)] transition hover:opacity-80"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="rounded-2xl px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{
                background:
                  "linear-gradient(135deg, #0ea5e9, color-mix(in srgb, #0ea5e9 70%, #000))",
              }}
            >
              <i className="fa-solid fa-sparkles mr-2" /> Open Account
            </Link>
          </div>

          <button
            aria-label="Menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 shadow-lg transition-all hover:-translate-y-0.5 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 lg:hidden"
          >
            <i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"} text-lg`} />
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-black/5 py-4 lg:hidden dark:border-white/10">
            <div className="space-y-1">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <i
                    className={`fa-solid ${item.icon ?? "fa-link"} mr-3 w-5 text-center text-gray-400`}
                  />
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex gap-3 border-t border-black/5 pt-4 dark:border-white/10">
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-[var(--brand)] transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <i className="fa-solid fa-right-to-bracket mr-2" /> Login
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMenuOpen(false)}
                className="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#0ea5e9" }}
              >
                <i className="fa-solid fa-user-plus mr-2" /> Register
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
