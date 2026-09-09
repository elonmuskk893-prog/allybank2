"use client";
import { SafeHtml, looksLikeHtml } from "@/components/dashboard/safe-html";

import { useEffect, useState } from "react";
import { bankFetch } from "@/lib/api";
import type { NotificationItem } from "@/lib/types";
import Link from "@/lib/next/link";

interface NotificationsResponse {
  notifications: NotificationItem[];
  unread: number;
}

/** Bell button with a dropdown of notifications, polling every 30s. */
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    const result = await bankFetch<NotificationsResponse>("/notifications");
    if (result.ok && result.data) {
      setItems(result.data.notifications);
      setUnread(result.data.unread);
    }
  };

  const markAllRead = async () => {
    await bankFetch("/notifications/mark-all-read", { method: "POST" });
    load();
  };

  const markRead = async (id: number | string) => {
    await bankFetch(`/notifications/${id}/read`, { method: "POST" });
    load();
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        className="relative rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04] p-2 text-zinc-700 dark:text-zinc-300 transition hover:bg-black/[0.08] dark:hover:bg-white/[0.08]"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a7 7 0 0 0-7 7v4.586L3.293 15.293A1 1 0 0 0 4 17h16a1 1 0 0 0 .707-1.707L19 13.586V9a7 7 0 0 0-7-7zm0 20a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3z" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 w-4 min-w-[16px] place-items-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-80 rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between px-2 py-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Notifications
              </h3>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-zinc-500">
                  Nothing here yet.
                </p>
              ) : (
                items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link ?? "#"}
                    onClick={() => markRead(item.id)}
                    className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${
                      !item.read_at ? "bg-indigo-500/5" : ""
                    }`}
                  >
                    <div
                      className={`text-sm ${
                        !item.read_at
                          ? "font-semibold text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {item.title}
                    </div>
                    {item.body && (
                      <div className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                        {looksLikeHtml(item.body) ? (
                          <SafeHtml html={item.body} className="[&_img]:max-w-full [&_*]:line-clamp-2" />
                        ) : (
                          item.body
                        )}
                      </div>
                    )}
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                      {new Date(item.created_at ?? "").toLocaleString()}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}