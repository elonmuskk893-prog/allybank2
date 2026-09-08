import Link from "next/link";

interface ComingSoonProps {
  page?: string;
}

/** Placeholder rendered for routes that haven't been rebuilt yet. */
export function ComingSoon({ page }: ComingSoonProps) {
  const title = page ? page.replace(/-/g, " ") : "This page";
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-900">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200/50 bg-white p-8 text-center shadow-xl dark:border-gray-700/50 dark:bg-gray-800">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gray-100 dark:bg-gray-700">
          <i className="fa-solid fa-wrench text-xl text-gray-400" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          {title} is coming soon
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          We&apos;re rebuilding this section. Check back shortly.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
          style={{ background: "linear-gradient(to right, var(--brand), rgba(0,0,0,0.25))" }}
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}