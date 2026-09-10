import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;

/**
 * Hash a value (PIN, master auth code, challenge token) with scrypt + salt.
 * The stored format is `scrypt:<salt-hex>:<hash-hex>`.
 */
export async function hashPassword(value: string): Promise<{ hash: string }> {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(value, salt, SCRYPT_KEYLEN).toString("hex");
  return { hash: `scrypt:${salt}:${derived}` };
}

export async function verifyPassword(value: string, stored: string): Promise<boolean> {
  const [scheme, salt, expected] = (stored ?? "").split(":");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const derived = scryptSync(value, salt, SCRYPT_KEYLEN);
  const expectedBuf = Buffer.from(expected, "hex");
  if (derived.length !== expectedBuf.length) return false;
  return timingSafeEqual(derived, expectedBuf);
}

/** Random opaque challenge token for 2FA flows. */
export function generateChallenge(): string {
  return randomBytes(24).toString("hex");
}

/** Random 10-digit account number. */
export function generateAccountNumber(): string {
  return String(Math.floor(1000000000 + Math.random() * 9000000000));
}

/**
 * Sign/verify impersonation cookie values (userId binding). The signing key
 * is the service-role JWT — never exposed to the client.
 */
export function signImpersonationValue(value: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for impersonation sessions");
  }
  return `${value}.${createHmac("sha256", secret).update(value).digest("hex").slice(0, 32)}`;
}

export function verifyImpersonationValue(signed: string | undefined): string | null {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx <= 0) return null;
  const value = signed.slice(0, idx);
  return signImpersonationValue(value) === signed ? value : null;
}

/** Random 6-digit numeric code (mock/OTP fallback). */
export function generateNumericCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}