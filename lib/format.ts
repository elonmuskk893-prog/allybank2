/** Format a number as a currency string for the given currency code. */
export function formatCurrency(
  currency = "USD",
  amount: number,
): string {
  const code = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    const safe = Number.isFinite(amount) ? amount : 0;
    const sign = Number(safe.toFixed(2)) < 0 ? "-" : "";
    const digits = Math.abs(safe).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${sign}${code}${digits}`;
  }
}

/** Resolve the currency symbol (e.g. "$") for a currency code. */
export function currencySymbol(currency = "USD"): string {
  const code = (currency || "USD").toUpperCase();
  try {
    const part = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
    })
      .formatToParts(0)
      .find((p) => p.type === "currency");
    return part?.value ?? code;
  } catch {
    return code;
  }
}

/** Font Awesome icon class for a crypto asset symbol. */
export function cryptoIcon(symbol: string): string {
  switch (symbol.toUpperCase()) {
    case "BTC":
      return "fa-brands fa-bitcoin";
    case "ETH":
      return "fa-brands fa-ethereum";
    default:
      return "fa-solid fa-coins";
  }
}

/** Format an ISO date string for display in transaction lists. */
export function formatDateTime(date: string): string {
  const parsed = new Date(date);
  const day = parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day}, ${time}`;
}

/** "Good morning/afternoon/evening" greeting based on local time. */
export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Sanitize a free-form amount input: keep digits and a single decimal point.
 * Mirrors the original `pq` input helper used by money entry fields.
 */
export function sanitizeAmount(value: string): string {
  let seenDot = false;
  let out = "";
  for (const ch of value) {
    if (ch >= "0" && ch <= "9") {
      out += ch;
    } else if (ch === "." && !seenDot) {
      seenDot = true;
      out += ch;
    }
  }
  return out;
}

/** Parse a sanitized amount string into a number (mirrors original `C_`). */
export function parseNumeric(value: string): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}