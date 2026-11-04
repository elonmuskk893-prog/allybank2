/**
 * Smartsupp live-chat loader.
 *
 * Kept separate from the React component so the loader helpers can be reused
 * (e.g. by the built-in chat to detect a duplicate widget) without breaking
 * Fast Refresh.
 */

const SMARTSUPP_KEY = "42b79b8a529e6be87e789b277f685a960e8ef4df";
const SMARTSUPP_SCRIPT_ID = "smartsupp-loader";

/** Fired once the Smartsupp loader has been injected. */
export const SMARTSUPP_READY_EVENT = "smartsupp:ready";

type SmartsuppQueue = ((...args: unknown[]) => void) & { _: unknown[][] };

declare global {
  interface Window {
    _smartsupp?: { key?: string };
    smartsupp?: SmartsuppQueue;
    __smartsuppReady?: boolean;
  }
}

/** True once the Smartsupp loader has been injected in this page session. */
export function isSmartsuppActive(): boolean {
  return typeof window !== "undefined" && Boolean(window.__smartsuppReady);
}

/** Inject the official Smartsupp loader exactly once per page load. */
export function loadSmartsupp(): void {
  if (typeof window === "undefined" || window.__smartsuppReady) return;

  window.__smartsuppReady = true;
  window._smartsupp = window._smartsupp ?? {};
  window._smartsupp.key = SMARTSUPP_KEY;

  if (!window.smartsupp) {
    // Mirrors the official snippet: calls made before loader.js arrives are
    // queued on `smartsupp._` and replayed by the real implementation.
    const queue = function (...args: unknown[]) {
      queue._.push(args);
    } as SmartsuppQueue;
    queue._ = [];
    window.smartsupp = queue;

    if (!document.getElementById(SMARTSUPP_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SMARTSUPP_SCRIPT_ID;
      script.type = "text/javascript";
      script.charset = "utf-8";
      script.async = true;
      script.src = "https://www.smartsuppchat.com/loader.js?";
      const first = document.getElementsByTagName("script")[0];
      const parent = first?.parentNode ?? document.head;
      parent.insertBefore(script, first ?? null);
    }
  }

  window.dispatchEvent(new Event(SMARTSUPP_READY_EVENT));
}
