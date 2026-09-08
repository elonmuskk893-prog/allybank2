import Link from "next/link";

export function MobileAuthBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex lg:hidden">
      <Link
        href="/auth/login"
        className="flex-1 border border-black/10 bg-white/90 px-6 py-3 text-center font-semibold text-[var(--brand)] shadow-lg backdrop-blur-xl transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-gray-800/90 dark:hover:bg-gray-700"
      >
        <i className="fa-solid fa-right-to-bracket mr-2" /> Login
      </Link>
      <Link
        href="/auth/register"
        className="flex-1 px-6 py-3 text-center font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
        style={{ background: "#0ea5e9" }}
      >
        <i className="fa-solid fa-user-plus mr-2" /> Register
      </Link>
    </div>
  );
}