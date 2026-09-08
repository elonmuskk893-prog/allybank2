"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

/** Header theme toggle (sun / moon). */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      suppressHydrationWarning
      className="grid h-11 w-11 place-items-center rounded-2xl bg-gray-50 transition hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      {isDark ? (
        <i className="fa-solid fa-sun text-yellow-500" />
      ) : (
        <i className="fa-solid fa-moon text-gray-600" />
      )}
    </button>
  );
}