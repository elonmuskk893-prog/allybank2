import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { SmartsuppWidget } from "@/components/smartsupp-widget";
import { renderErrorPage } from "@/lib/error-page";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import appCss from "@/styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AllyBank — Secure Online Banking" },
      {
        name: "description",
        content:
          "AllyBank — secure online banking with instant transfers, cards, loans and 24/7 account access.",
      },
      { property: "og:title", content: "AllyBank — Secure Online Banking" },
      {
        property: "og:description",
        content:
          "Open an account, move money worldwide and manage cards, loans and deposits in one secure place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/gh/aquawolf04/font-awesome-pro@5cd1511/css/all.css",
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  errorComponent: ({ error }) => {
    reportLovableError(error);
    return <div dangerouslySetInnerHTML={{ __html: renderErrorPage() }} />;
  },
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <Outlet />
          <SmartsuppWidget />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
