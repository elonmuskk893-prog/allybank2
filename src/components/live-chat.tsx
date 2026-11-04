"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "@/lib/next/navigation";
import { bankFetch } from "@/lib/api";

export interface LiveChatSettings {
  enabled?: boolean;
  position?: string;
  offset_bottom?: number;
  welcome_message?: string;
  title?: string;
  dashboard_only?: boolean;
}

const DASHBOARD_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/transfer",
  "/deposit",
  "/withdraw",
  "/cards",
  "/beneficiaries",
  "/loans",
  "/grants",
  "/notifications",
  "/settings",
  "/support",
  "/pin",
  "/apps",
];

function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

interface ChatLine {
  from: "you" | "support";
  text: string;
}

export function LiveChat() {
  const pathname = usePathname() ?? "";
  const [settings, setSettings] = useState<LiveChatSettings | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const ticketId = useRef<string | null>(null);

  const onDashboard = isDashboardRoute(pathname);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [settingsRes, meRes] = await Promise.all([
        fetch("/api/banking-public/site-settings").then((r) => r.json()).catch(() => null),
        bankFetch<{ user?: { id?: string } }>("/me"),
      ]);
      if (cancelled) return;
      setSettings((settingsRes?.data?.live_chat as LiveChatSettings) ?? null);
      setSignedIn(Boolean(meRes.ok && meRes.data));
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const active = useMemo(() => {
    if (!settings?.enabled) return null;
    if (settings.dashboard_only !== false && !(onDashboard && signedIn)) return null;
    return settings;
  }, [settings, onDashboard, signedIn]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setLines((prev) => [...prev, { from: "you", text }]);
    setDraft("");
    const res = ticketId.current
      ? await bankFetch(`/support/tickets/${ticketId.current}/message`, {
          method: "POST",
          body: { body: text },
        })
      : await bankFetch<{ id: string }>("/support/tickets", {
          method: "POST",
          body: { category: "live_chat", subject: "Live chat", message: text },
        });
    setSending(false);
    if (!res.ok) {
      setLines((prev) => [...prev, { from: "support", text: "We couldn't send that just now. Please try again." }]);
      return;
    }
    const created = res.data as { id?: string } | null;
    if (created?.id) ticketId.current = created.id;
    setLines((prev) => [
      ...prev,
      { from: "support", text: "Thanks — our team has your message and will reply here and by email shortly." },
    ]);
  }, [draft, sending]);

  if (!active) return null;

  const offset = Number(active.offset_bottom ?? 96);
  const left = active.position === "bottom-left";

  return (
    <div
      className="fixed z-[35] flex flex-col items-end gap-3 lg:!bottom-6"
      style={{ bottom: offset, [left ? "left" : "right"]: 16 } as React.CSSProperties}
    >
      {open && (
        <div className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "var(--brand)" }}>
            <span className="text-sm font-semibold">{active.title ?? "Live support"}</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>
          <div className="max-h-64 space-y-3 overflow-y-auto px-4 py-4">
            <p className="rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {active.welcome_message ?? "Hi! How can we help you today?"}
            </p>
            {lines.map((line, index) => (
              <p
                key={index}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  line.from === "you"
                    ? "ml-auto bg-sky-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                {line.text}
              </p>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-gray-200 p-3 dark:border-gray-700">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Type a message…"
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={send}
              disabled={sending}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              Send
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Live chat"
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl"
        style={{ background: "var(--brand)" }}
      >
        <i className={`fa-solid ${open ? "fa-xmark" : "fa-comments"} text-lg`} />
      </button>
    </div>
  );
}
