/**
 * Smartsupp live-chat loader.
 *
 * Kept separate from the React component so the loader helpers can be reused
 * (e.g. by the built-in chat to detect a duplicate widget) without breaking
 * Fast Refresh.
 *
 * Browser extensions, tracking-protection lists and filtered DNS resolvers
 * commonly block chat widgets outright. When that happens the request never
 * reaches our CSP or code, so the loader tracks the script state and the
 * built-in chat takes over instead of leaving a signed-in member with no way
 * to reach support.
 */

const SMARTSUPP_KEY = "42b79b8a529e6be87e789b277f685a960e8ef4df";
const SMARTSUPP_SCRIPT_ID = "smartsupp-loader";

/**
 * Tried in order. `www.` is what the official snippet uses; the apex host
 * serves the same bundle, so it is a useful retry when a blocklist only
 * matches the `www` hostname.
 */
const SMARTSUPP_SOURCES = [
  "https://www.smartsuppchat.com/loader.js?",
  "https://smartsuppchat.com/loader.js?",
] as const;

/** Give a slow/blocked script a bounded amount of time before falling back. */
const SMARTSUPP_LOAD_TIMEOUT_MS = 6000;

/** Fired whenever {@link smartsuppStatus} changes. */
export const SMARTSUPP_STATUS_EVENT = "smartsupp:status";

/** Fired once the loader script has actually executed. */
export const SMARTSUPP_READY_EVENT = "smartsupp:ready";

export type SmartsuppStatus = "idle" | "loading" | "ready" | "failed";

type SmartsuppQueue = ((...args: unknown[]) => void) & { _: unknown[][] };

declare global {
  interface Window {
    _smartsupp?: { key?: string };
    smartsupp?: SmartsuppQueue;
    __smartsuppStatus?: SmartsuppStatus;
    /** @deprecated Use {@link smartsuppStatus}. */
    __smartsuppReady?: boolean;
  }
}

let nextSource = 0;
let timeoutId: ReturnType<typeof setTimeout> | undefined;

function setStatus(status: SmartsuppStatus): void {
  if (typeof window === "undefined" || window.__smartsuppStatus === status) return;
  window.__smartsuppStatus = status;
  window.dispatchEvent(new Event(SMARTSUPP_STATUS_EVENT));
  if (status === "ready") window.dispatchEvent(new Event(SMARTSUPP_READY_EVENT));
}

/** Current loader state for this page load. */
export function smartsuppStatus(): SmartsuppStatus {
  if (typeof window === "undefined") return "idle";
  return window.__smartsuppStatus ?? "idle";
}

/** True once the Smartsupp bundle has loaded and owns the chat widget. */
export function isSmartsuppActive(): boolean {
  return smartsuppStatus() === "ready";
}

function clearTimer(): void {
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  }
}

function injectScript(source: string): void {
  document.getElementById(SMARTSUPP_SCRIPT_ID)?.remove();

  const script = document.createElement("script");
  script.id = SMARTSUPP_SCRIPT_ID;
  script.type = "text/javascript";
  script.charset = "utf-8";
  script.async = true;
  script.src = source;

  script.addEventListener("load", () => {
    clearTimer();
    setStatus("ready");
  });

  script.addEventListener("error", () => {
    clearTimer();
    nextSource += 1;
    const fallback = SMARTSUPP_SOURCES[nextSource];
    if (fallback) {
      // The blocked host is a client-side/filtering decision, but the mirror
      // host is sometimes still reachable.
      injectScript(fallback);
      return;
    }
    setStatus("failed");
    console.warn(
      "[smartsupp] loader could not be loaded; falling back to the built-in chat. " +
        "This is usually caused by an ad blocker, tracking protection or a filtered DNS resolver.",
    );
  });

  const first = document.getElementsByTagName("script")[0];
  const parent = first?.parentNode ?? document.head;
  parent.insertBefore(script, first ?? null);
}

/** Inject the official Smartsupp loader exactly once per page load. */
export function loadSmartsupp(): void {
  if (typeof window === "undefined") return;

  const status = smartsuppStatus();
  if (status === "loading" || status === "ready") return;

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
  }

  setStatus("loading");
  clearTimer();
  timeoutId = setTimeout(() => {
    timeoutId = undefined;
    if (smartsuppStatus() === "loading") {
      // A blocked request often never fires `error`, so stop waiting.
      setStatus("failed");
    }
  }, SMARTSUPP_LOAD_TIMEOUT_MS);

  injectScript(SMARTSUPP_SOURCES[nextSource]);
}
