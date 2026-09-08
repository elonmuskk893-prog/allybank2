"use client";
import { SafeHtml, looksLikeHtml } from "@/components/dashboard/safe-html";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import { bankFetch } from "@/lib/api";
import type { NotificationItem } from "@/lib/types";

interface NotificationsResponse {
  notifications: NotificationItem[];
  unread: number;
}

export default function NotificationsPage() {
  return (
    <AppShell>
      <NotificationsFlow />
    </AppShell>
  );
}

function NotificationsFlow() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function load() {
    const res = await bankFetch<NotificationsResponse>("/notifications");
    if (res.ok && res.data) {
      setItems(res.data.notifications);
      setUnread(res.data.unread);
    }
    setLoading(true);
  }

  async function markAllRead() {
    if (0 === unread) return;
    setBusy(true);
    await bankFetch("/notifications/mark-all-read", { method: "POST" });
    await load();
    setBusy(false);
  }

  async function deleteAll() {
    setBusy(true);
    await bankFetch("/notifications", { method: "DELETE" });
    setConfirmOpen(false);
    await load();
    setBusy(false);
  }

  async function deleteOne(id: number | string) {
    await bankFetch(`/notifications/${id}`, { method: "DELETE" });
    load();
  }

  async function handleClick(notification: NotificationItem) {
    if (!notification.read_at) {
      await bankFetch(`/notifications/${notification.id}/read`, { method: "POST" });
      load();
    }
    if (notification.link) {
      if (/^https?:\/\//i.test(notification.link)) {
        window.open(notification.link, "_blank", "noopener");
      } else {
        window.location.assign(notification.link);
      }
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="-mx-4 -my-5 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 lg:-mx-6 lg:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 hidden lg:block">
          <div className="flex items-center justify-between">
            <div className="mb-2 flex items-center gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-xl text-white"
                style={{ background: "var(--brand)" }}
              >
                <i className="fa-solid fa-bell text-lg" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {unread > 0
                    ? `You have ${unread} unread notification${1 === unread ? "" : "s"}`
                    : "Manage your account notifications and updates"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={markAllRead}
                disabled={busy || 0 === unread}
                className="inline-flex items-center rounded-xl border border-gray-300 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-300 dark:hover:bg-gray-600/70"
              >
                <i className="fa-solid fa-check-circle mr-2" />
                {" Mark all read"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={busy || 0 === items.length}
                className="inline-flex items-center rounded-xl border border-red-300 bg-white/70 px-4 py-2 text-sm font-medium text-red-700 shadow-sm backdrop-blur-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-600/60 dark:bg-gray-700/70 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                <i className="fa-solid fa-trash-alt mr-2" />
                {" Delete all"}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between gap-2 lg:hidden">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={markAllRead}
              disabled={busy || 0 === unread}
              className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              <i className="fa-solid fa-check-circle mr-1.5" />
              {" Read all"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={busy || 0 === items.length}
              className="inline-flex items-center rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50"
            >
              <i className="fa-solid fa-trash-alt mr-1.5" />
              {" Clear"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95">
          {loading ? (
            0 === items.length ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-4 rounded-xl bg-gray-100 p-4 dark:bg-gray-700/40">
                  <i className="fa-solid fa-inbox text-3xl text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                  No notifications yet
                </h3>
                <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
                  You&apos;re all caught up! Notifications appear here when
                  there are updates related to your account.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {items.map((notification) => {
                  const isUnread = !notification.read_at;
                  const clickable = isUnread || !!notification.link;
                  return (
                    <li
                      key={notification.id}
                      onClick={clickable ? () => handleClick(notification) : undefined}
                      className={`flex items-start gap-3 p-4 transition ${clickable ? "cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03]" : ""} ${isUnread ? "border-l-4" : "border-l-4 border-transparent"}`}
                      style={
                        isUnread
                          ? {
                              borderLeftColor: "var(--brand)",
                              background:
                                "color-mix(in srgb, var(--brand) 5%, transparent)",
                            }
                          : undefined
                      }
                    >
                      <div className="relative shrink-0">
                        <div
                          className="grid h-10 w-10 place-items-center rounded-lg text-white shadow-md"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--brand), rgba(0,0,0,0.35))",
                          }}
                        >
                          <i className="fa-solid fa-bell text-sm" />
                        </div>
                        {isUnread && (
                          <span
                            className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800"
                            style={{ background: "var(--brand)" }}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4
                              className={`truncate text-sm ${isUnread ? "font-bold text-gray-900 dark:text-white" : "font-semibold text-gray-700 dark:text-gray-300"}`}
                            >
                              {notification.title}
                            </h4>
                            {notification.body &&
                              (looksLikeHtml(notification.body) ? (
                                <SafeHtml
                                  html={notification.body}
                                  className="mt-0.5 break-words text-sm text-gray-600 dark:text-gray-300 [&_a]:underline [&_img]:max-w-full [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                />
                              ) : (
                                <p className="mt-0.5 break-words text-sm text-gray-600 dark:text-gray-300">
                                  {notification.body}
                                </p>
                              ))}
                            <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                <i className="fa-solid fa-calendar-alt mr-1" />
                                {notification.created_at
                                  ? new Date(notification.created_at).toLocaleDateString(
                                      undefined,
                                      { month: "short", day: "numeric", year: "numeric" },
                                    )
                                  : ""}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-gray-400" />
                              <span>
                                <i className="fa-solid fa-clock mr-1" />
                                {notification.created_at
                                  ? new Date(notification.created_at).toLocaleTimeString(
                                      undefined,
                                      { hour: "numeric", minute: "2-digit" },
                                    )
                                  : ""}
                              </span>
                              {notification.link && (
                                <>
                                  <span className="h-1 w-1 rounded-full bg-gray-400" />
                                  <span style={{ color: "var(--brand)" }}>
                                    <i className="fa-solid fa-arrow-up-right-from-square mr-1" />
                                    {"Open"}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteOne(notification.id);
                            }}
                            aria-label="Delete notification"
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                          >
                            <i className="fa-solid fa-xmark text-sm" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <div className="px-4 py-12 text-center text-sm text-gray-500">
              Loading…
            </div>
          )}
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
            onClick={() => !busy && setConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-white p-6 shadow-2xl dark:border-gray-700/50 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-red-400 to-pink-500 text-white">
                <i className="fa-solid fa-trash-alt" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete all notifications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to delete all your notifications? This
              permanently removes them from your account.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAll}
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition hover:from-red-600 hover:to-pink-600 disabled:opacity-50"
              >
                {busy && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {" Delete all"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}