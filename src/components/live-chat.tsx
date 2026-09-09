"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "@/lib/next/navigation";
import { bankFetch } from "@/lib/api";

/**
 * Live chat for signed-in customers.
 *
 * Two providers, both configured in Admin → Live chat:
 *   - "builtin"   → in-house chat panel that files a support ticket the admin
 *                   can answer in Admin → Tickets.
 *   - "smartsupp" → third-party widget loaded from the saved key.
 *
 * It only ever renders inside the customer dashboard (never on the homepage,
 * login or registration), and it is offset above the mobile bottom navigation
 * so it can't cover the "More" menu or any dashboard control.
 */

export interface LiveChatSettings {
  provider?: string;
  enabled?: boolean;
  key?: string;
  position?: string;
  offset_bottom?: number;
  welcome_message?: string;
  title?: string;
  dashboard_only?: boolean;
}

/** Routes that belong to the signed-in dashboard experience. */
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

function extractSmartsuppKey(input: string): string | null {
  const value = (input ?? "").trim();
  if (!value) return null;
  if (/^[\w-]{8,}$/.test(value)) return value;
  const match = value.match(/key\s*[:=]\s*["']([\w-]+)["']/);
  return match ? match[1] : null;
}

declare global {
  interface Window {
    _smartsupp?: { key?: string; offsetY?: number; offsetX?: number; [k: string]: unknown };
  }
}

function teardownSmartsupp() {
  document.getElementById("smartsupp-widget-script")?.remove();
  document.getElementById("smartsupp-lift-style")?.remove();
  Array.from(document.body.children)
    .filter(
      (node) =>
        /smartsupp/i.test(`${node.id} ${node.className}`) ||
        (node.tagName === "IFRAME" && /smartsupp/i.test(node.getAttribute("src") ?? "")),
    )
    .forEach((el) => el.remove());
  delete window._smartsupp;
}

/** Pixels the chat bubble is lifted above the mobile bottom navigation. */
const SMARSUPP_EXTRA_LIFT = 40;

function liftSmartsuppNode(node: HTMLElement, offset: number) {
  node.style.setProperty("bottom", `${offset + SMARSUPP_EXTRA_LIFT}px`, "important");
  node.style.setProperty("z-index", "35", "important");
}

/** Force-lift anything Smartsupp injects (its bubble sets inline positioning). */
function liftInjectedSmartsupp(offset: number) {
  const candidates = document.querySelectorAll<HTMLElement>(
    '[id*="smartsupp" i], [class*="smartsupp" i], iframe[src*="smartsupp" i]',
  );
  candidates.forEach((el) => {
    const target =
      el.tagName === "IFRAME" && el.parentElement ? el.parentElement : el;
    if (target !== document.documentElement && target !== document.body) {
      liftSmartsuppNode(target, offset);
    }
  });
}

function mountSmartsupp(key: string, offset: number) {
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  if (!document.getElementById("smartsupp-widget-script")) {
    window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = key;
    // Smartsupp's official offset option — lifts the bubble above our bottom nav.
    window._smartsupp.offsetY = isDesktop ? 0 : offset + SMARSUPP_EXTRA_LIFT;
    const script = document.createElement("script");
    script.id = "smartsupp-widget-script";
    script.charset = "utf-8";
    script.async = true;
    script.src = "https://www.smartsuppchat.com/loader.js";
    document.body.appendChild(script);
  }
  if (!isDesktop && !document.getElementById("smartsupp-lift-style")) {
    // Fallback: watch for injected widget nodes and lift them too, in case the
    // offsetY option is ignored by a future widget version.
    liftInjectedSmartsupp(offset);
    const observer = new MutationObserver(() => liftInjectedSmartsupp(offset));
    observer.observe(document.body, { childList: true, subtree: true });
    window.setInterval(() => liftInjectedSmartsupp(offset), 2500);
  }
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

  // Third-party widget lifecycle.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const key = active && active.provider === "smartsupp" ? extractSmartsuppKey(active.key ?? "") : null;
    if (!key) {
      teardownSmartsupp();
      return;
    }
    mountSmartsupp(key, Number(active?.offset_bottom ?? 96));
  }, [active]);

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

  if (!active || active.provider === "smartsupp") return null;

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
