import type { Session } from "@/lib/types";

/** Whether the user still needs to complete KYC for this site.
 *  Administrators are never gated by customer KYC. */
export function needsKyc(session: Session): boolean {
  if (session.user.role === "admin") return false;
  return !!session.site.kyc_required && session.user.kyc_status !== "verified";
}