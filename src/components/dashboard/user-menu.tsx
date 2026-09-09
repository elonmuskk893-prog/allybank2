import type { Session } from "@/lib/types";
import { Avatar } from "@/components/dashboard/avatar";
import Link from "@/lib/next/link";

interface UserMenuProps {
  me: Session;
  brand: string;
  onLogout: () => void;
  onClose: () => void;
}

/** Dropdown menu under the header avatar. */
export function UserMenu({ me, brand, onLogout, onClose }: UserMenuProps) {
  const status = me.user.kyc_status;
  const fullName =
    [me.user.first_name, me.user.last_name].filter(Boolean).join(" ") ||
    me.user.email;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-gray-200/50 bg-white shadow-2xl dark:border-gray-700/50 dark:bg-gray-800">
        <div className="border-b border-gray-100 p-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Avatar
              url={me.user.photo_url}
              name={fullName}
              brand={brand}
              className="h-10 w-10 rounded-full"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                {fullName}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {me.user.email}
              </p>
            </div>
          </div>
          <div className="mt-3">
            {status === "verified" ? (
              <div className="flex items-center justify-center rounded-xl border border-green-100 bg-green-50 py-2 dark:border-green-800 dark:bg-green-900/30">
                <span className="flex items-center text-xs font-semibold text-green-800 dark:text-green-300">
                  <i className="fa-solid fa-check-circle mr-2 text-green-600 dark:text-green-400" />
                  KYC Verified
                </span>
              </div>
            ) : status === "pending" ? (
              <div className="flex items-center justify-center rounded-xl border border-yellow-100 bg-yellow-50 py-2 dark:border-yellow-800 dark:bg-yellow-900/30">
                <span className="flex items-center text-xs font-semibold text-yellow-800 dark:text-yellow-300">
                  <i className="fa-solid fa-clock mr-2 text-yellow-600 dark:text-yellow-400" />
                  KYC Under Review
                </span>
              </div>
            ) : (
              <Link
                href="/settings/kyc"
                className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 py-2 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:hover:bg-red-900/50"
              >
                <span className="flex items-center text-xs font-semibold text-red-800 dark:text-red-300">
                  <i className="fa-solid fa-exclamation-triangle mr-2 text-red-600 dark:text-red-400" />
                  {status === "rejected" ? "KYC Rejected" : "KYC Unverified"}
                </span>
                <span className="mt-0.5 text-[11px] font-medium text-red-700/80 dark:text-red-400/80">
                  {status === "rejected" ? "Fix and resend →" : "Verify now →"}
                </span>
              </Link>
            )}
          </div>
        </div>

        <div className="p-2">
          <Link
            href="/settings"
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gray-100 dark:bg-gray-700">
              <i className="fa-solid fa-user text-sm text-gray-500 dark:text-gray-400" />
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Profile Settings
            </span>
          </Link>
          <Link
            href="/support"
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gray-100 dark:bg-gray-700">
              <i className="fa-solid fa-headset text-sm text-gray-500 dark:text-gray-400" />
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Help & Support
            </span>
          </Link>
          <div className="my-2 border-t border-gray-100 dark:border-gray-700" />
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-red-100 dark:bg-red-900/30">
              <i className="fa-solid fa-right-from-bracket text-sm text-red-500 dark:text-red-400" />
            </span>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              Sign Out
            </span>
          </button>
        </div>
      </div>
    </>
  );
}