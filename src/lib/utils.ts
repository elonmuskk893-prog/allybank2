import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional Tailwind class names without conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a user-typed money amount tolerantly: strips currency symbols,
 * thousand separators and spaces ("$1,250.50" -> 1250.5).
 * Returns null when nothing numeric remains.
 */
export function parseAmountInput(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}