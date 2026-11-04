"use client";

import { useEffect } from "react";
import { usePathname } from "@/lib/next/navigation";
import { bankFetch } from "@/lib/api";
import { loadSmartsupp } from "@/lib/smartsupp";

/**
 * Smartsupp live chat.
 *
 * The widget is injected only after `/me` confirms an authenticated member, so
 * visitors on the public marketing/auth pages never download the third-party
 * script. Route changes re-check the session, which covers SPA login/logout
 * without a full page reload. A window-level guard keeps the loader injected
 * exactly once per page load.
 */
export function SmartsuppChat() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await bankFetch<{
        user?: { id?: string | number; pin_gate?: boolean };
      }>("/me");
      if (cancelled) return;

      const signedIn = Boolean(result.ok && result.data?.user?.id && !result.data.user.pin_gate);

      if (signedIn) {
        loadSmartsupp();
        // Re-show after a previous logout: the script stays cached, the widget
        // is hidden rather than unloaded.
        window.smartsupp?.("chat:show");
      } else if (window.smartsupp) {
        // Never show the widget to a signed-out visitor, even when the script
        // is already present from an earlier session in this tab.
        window.smartsupp("chat:close");
        window.smartsupp("chat:hide");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
