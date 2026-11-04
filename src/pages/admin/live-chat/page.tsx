"use client";

import Link from "@/lib/next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";

interface LiveChatSettings {
  provider?: string;
  enabled?: boolean;
  position?: string;
  welcome_message?: string;
  dashboard_only?: boolean;
}

/**
 * Live-chat overview. All chat options are edited in one place
 * (Settings → Live chat) so the two screens can never disagree.
 */
function LiveChatAdmin() {
  const { slug } = useAdmin();
  const [chat, setChat] = useState<LiveChatSettings | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch<{ live_chat: LiveChatSettings }>(slug, "/settings");
    if (res.ok && res.data?.live_chat) setChat(res.data.live_chat);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const rows: [string, string][] = [
    ["Status", chat?.enabled ? "Enabled" : "Disabled"],
    ["Provider", "Smartsupp (signed-in) + built-in chat"],
    ["Bubble position", chat?.position === "bottom-left" ? "Bottom left" : "Bottom right"],
    ["Shown on", chat?.dashboard_only === false ? "All pages" : "Signed-in dashboard only"],
    ["Welcome message", chat?.welcome_message ?? "—"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Live chat
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Current chat configuration for the customer-facing website. Signed-in members get the
          Smartsupp widget automatically; the built-in chat feeds Tickets for the audience selected
          below.
        </p>
      </div>

      <section className="max-w-2xl space-y-3 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-6 border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800"
          >
            <span className="text-xs uppercase tracking-wider text-gray-400">{label}</span>
            <span className="text-right text-sm font-medium text-gray-900 dark:text-gray-100">
              {chat ? value : "…"}
            </span>
          </div>
        ))}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/admin/settings"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            Edit chat settings
          </Link>
          <Link
            href="/admin/tickets"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            View chat messages
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function AdminLiveChatPage() {
  return (
    <AdminShell>
      <LiveChatAdmin />
    </AdminShell>
  );
}
