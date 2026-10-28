import type { PaymentMethod } from "./schema";

const CRYPTO_METHOD_RE =
  /crypto|bitcoin|\bbtc\b|usdt|tether|ethereum|\beth\b|litecoin|\bltc\b/i;

/** Crypto payment details are never masked — only bank/account details are. */
export function isCryptoMethod(method: Pick<PaymentMethod, "id" | "name">): boolean {
  return CRYPTO_METHOD_RE.test(`${method.id} ${method.name}`);
}

/** Keep a recognisable prefix, hide the rest — e.g. 5441****, Grace****. */
export function maskDetailValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "****";
  const keep = Math.min(Math.max(3, Math.ceil(trimmed.length * 0.4)), 6);
  return `${trimmed.slice(0, keep)}****`;
}

/** Mask the read-only display fields of a payment method; input fields and files stay untouched. */
export function maskPaymentMethodDetails(method: PaymentMethod): PaymentMethod {
  return {
    ...method,
    custom_fields: (method.custom_fields ?? []).map((field) =>
      field.role === "input" || field.type === "file" || !field.value?.trim()
        ? field
        : { ...field, value: maskDetailValue(field.value) },
    ),
  };
}
