"use client";

import { useEffect } from "react";
import { usePathname } from "@/lib/next/navigation";

interface SiteSettingsResponse {
  data?: {
    live_chat?: { enabled?: boolean; key?: string };
  };
}

/** Extracts the Smartsupp key whether the admin saved a bare key or a full snippet. */
function extractSmartsuppKey(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/^[\w-]{8,}$/.test(value)) return value;
  const match = value.match(/key\s*[:=]\s*["']([\w-]+)["']/);
  return match ? match[1] : null;
}

function isSmartsuppNode(node: Element): boolean {
  return (
    /smartsupp/i.test(`${node.id} ${node.className}`) ||
    (node.tagName === "IFRAME" &&
      (/smartsupp/i.test(node.getAttribute("src") ?? "") ||
        /martsupp/i.test(node.getAttribute("title") ?? "")))
  );
}

/** Lift the bubble clear of the dashboard's fixed bottom navigation. */
function applyLift() {
  const mobile = window.innerWidth < 1024;
  const bottom = mobile ? "132px" : "72px";
  // Walk every element (Smartsupp nests its launcher/window differently by
  // version); lift the top-level body ancestor of anything Smartsupp-related.
  document
    .querySelectorAll<HTMLElement>(
      '[id*="smartsupp" i], [class*="smartsupp" i], iframe[src*="smartsupp" i], iframe[title*="martsupp" i]',
    )
    .forEach((el) => {
      let top: HTMLElement | null = el as HTMLElement;
      while (top.parentElement && top.parentElement !== document.body) {
        top = top.parentElement;
      }
      if (top && top.parentElement === document.body) {
        top.style.setProperty("bottom", bottom, "important");
        top.style.setProperty("z-index", "35", "important");
      }
    });
}

/** Removes every trace of the widget from the page. */
function teardownWidget() {
  document.getElementById("smartsupp-widget-script")?.remove();
  document.getElementById("smartsupp-lift-style")?.remove();
  Array.from(document.body.children)
    .filter(isSmartsuppNode)
    .forEach((el) => el.remove());
  delete window._smartsupp;
}

declare global {
  interface Window {
    _smartsupp?: { key?: string; [k: string]: unknown };
  }
}

/**
 * Renders the Smartsupp live-chat widget on user-facing pages from the
 * admin-configured settings (Admin → Live chat).
 *
 * - Injected once from the root layout, so it appears across the whole
 *   user-facing site without per-page work.
 * - Fully removed on /admin routes.
 * - The floating bubble is permanently lifted (CSS + enforced inline styles)
 *   so it never covers the mobile bottom navigation or dashboard controls.
 */
export function SmartsuppWidget() {
  const pathname = usePathname();

  useEffect(() => {
    // Admin console never shows the widget; strip it if we arrived from a
    // customer-facing page.
    if (pathname?.startsWith("/admin")) {
      teardownWidget();
      return;
    }

    let cancelled = false;
    let liftTimer: ReturnType<typeof setInterval> | undefined;

    const startLift = () => {
      // Persistent stylesheet keeps the offset even between our ticks.
      if (!document.getElementById("smartsupp-lift-style")) {
        const style = document.createElement("style");
        style.id = "smartsupp-lift-style";
        style.textContent = `
          @media (max-width: 1023.98px) {
            body > div[id*="smartsupp" i],
            body > div[class*="smartsupp" i],
            body > div:has(> iframe[src*="smartsupp" i]),
            body > div:has(> iframe[title*="martsupp" i]) {
              bottom: 132px !important;
              right: 16px !important;
              z-index: 35 !important;
            }
          }
          @media (min-width: 1024px) {
            body > div[id*="smartsupp" i],
            body > div[class*="smartsupp" i],
            body > div:has(> iframe[src*="smartsupp" i]),
            body > div:has(> iframe[title*="martsupp" i"]) {
              bottom: 72px !important;
              z-index: 35 !important;
            }
          }`;
        document.head.appendChild(style);
      }
      // Cheap periodic enforcement — catches nodes the loader mounts later.
      if (!liftTimer) liftTimer = setInterval(applyLift, 900);
      applyLift();
    };

    (async () => {
      try {
        const res = await fetch("/api/banking-public/site-settings");
        const json = (await res.json()) as SiteSettingsResponse;
        if (cancelled) return;
        const chat = json.data?.live_chat;
        const key = chat?.enabled ? extractSmartsuppKey(chat.key ?? "") : null;
        if (!key) {
          teardownWidget();
          return;
        }
        startLift();
        if (document.getElementById("smartsupp-widget-script")) return;
        window._smartsupp = window._smartsupp || {};
        window._smartsupp.key = key;
        const script = document.createElement("script");
        script.id = "smartsupp-widget-script";
        script.charset = "utf-8";
        script.async = true;
        script.src = "https://www.smartsuppchat.com/loader.js";
        document.body.appendChild(script);
      } catch {
        // Settings unavailable — silently skip the widget.
      }
    })();

    return () => {
      cancelled = true;
      if (liftTimer) clearInterval(liftTimer);
    };
  }, [pathname]);

  return null;
}
