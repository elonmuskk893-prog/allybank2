"use client";

import { type ReactNode } from "react";

/** Colored status pill used across admin tables. */
export function Pill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    enabled: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    converted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    processing: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    in_review: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    in_progress: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    contacted: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    open: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    new: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    qualified: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    high: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    urgent: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    failed: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    declined: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    lost: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    blocked: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    closed: "bg-gray-200 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300",
    disabled: "bg-gray-200 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        map[status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function AdminSection({
  title,
  actions,
  children,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title ? (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
          ) : (
            <span />
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function TableWrap({ children, empty }: { children: ReactNode; empty: boolean; emptyText?: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200/70 bg-white backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800">
      {empty ? (
        <div className="p-8 text-center text-sm text-gray-500">Nothing here yet.</div>
      ) : (
        children
      )}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200/70 bg-white p-5 shadow-2xl dark:border-gray-700/60 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

export const btnPrimary =
  "rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50";
