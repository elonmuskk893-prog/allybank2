import type { NavGroup, NavItem } from "@/lib/nav";
import type { Session } from "@/lib/types";
import { Avatar } from "@/components/dashboard/avatar";
import Link from "@/lib/next/link";

interface MobileSheetMenuProps {
  groups: NavGroup[];
  isActive: (item: NavItem) => boolean;
  activePill: string;
  brand: string;
  me: Session;
  fullName: string;
  onLogout: () => void;
  onClose: () => void;
}

/** Bottom sheet menu opened from the mobile "More" button. */
export function MobileSheetMenu({
  groups,
  isActive,
  activePill,
  brand,
  me,
  fullName,
  onLogout,
  onClose,
}: MobileSheetMenuProps) {
  return (
    <div
      className="fixed inset-0 z-[60] lg:hidden"
      role="dialog"
      aria-modal="true"
    >
      <style>{`@keyframes bank-sheet-up{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-gray-200/50 bg-white/95 p-4 pb-8 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95"
        style={{ animation: "bank-sheet-up 0.25s ease-out" }}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />

        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-200/50 bg-gray-50 p-3 dark:border-gray-700/50 dark:bg-gray-800">
          <Avatar
            url={me.user.photo_url}
            name={fullName}
            brand={brand}
            className="h-10 w-10 rounded-full"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
              {fullName}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {me.user.email}
            </p>
          </div>
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400"
          >
            <i className="fa-solid fa-right-from-bracket text-sm" />
          </button>
        </div>

        {groups.map((group) => (
          <div key={group.title} className="mb-3">
            <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {group.title}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium ${
                      active
                        ? "text-white shadow-lg"
                        : "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                    style={active ? { background: activePill } : undefined}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                        active ? "bg-white/20" : "bg-white dark:bg-gray-700"
                      }`}
                    >
                      <i
                        className={`${item.icon} ${
                          active ? "text-white" : "text-gray-500 dark:text-gray-400"
                        }`}
                      />
                    </span>
                    <span className="truncate font-semibold">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}