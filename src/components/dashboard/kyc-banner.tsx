import type { Session } from "@/lib/types";
import { needsKyc } from "@/lib/kyc";
import Link from "@/lib/next/link";

interface KycBannerProps {
  me: Session;
}

const COPY = {
  pending: {
    text: "Your identity check is under review. Until it's approved you can receive money but not send it.",
    action: "View submission →",
    icon: "fa-clock",
  },
  rejected: {
    text: "Your identity check was sent back. Until you resend it you can receive money but not send it.",
    action: "Verify now →",
    icon: "fa-triangle-exclamation",
  },
  unverified: {
    text: "You haven't verified your identity yet. Until you do you can receive money but not send it.",
    action: "Verify now →",
    icon: "fa-triangle-exclamation",
  },
} as const;

/** Warning strip shown when the user's identity check is missing or pending. */
export function KycBanner({ me }: KycBannerProps) {
  if (!needsKyc(me)) return null;

  const status = me.user.kyc_status;
  const pending = status === "pending";
  const copy = COPY[pending ? "pending" : status === "rejected" ? "rejected" : "unverified"];

  return (
    <div
      className={
        pending
          ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
          : "bg-red-500/10 text-red-800 dark:text-red-200"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6">
        <span className="flex items-center gap-2">
          <i className={`fa-solid ${copy.icon} shrink-0`} />
          <span>{copy.text}</span>
        </span>
        <Link
          href="/settings/kyc"
          className="shrink-0 font-semibold underline-offset-2 hover:underline"
        >
          {copy.action}
        </Link>
      </div>
    </div>
  );
}