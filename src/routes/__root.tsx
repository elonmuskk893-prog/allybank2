import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { LiveChat } from "@/components/live-chat";
import { renderErrorPage } from "@/lib/error-page";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import "@/styles.css";

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
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/favicon-256.png", type: "image/png", sizes: "256x256" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://cdn.jsdelivr.net" },
    ],
    scripts: [
      {
        // Load icon + webfont CSS without blocking the first paint.
        children: `(function(){var h=["https://cdn.jsdelivr.net/gh/aquawolf04/font-awesome-pro@5cd1511/css/all.css","https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap"];for(var i=0;i<h.length;i++){var l=document.createElement("link");l.rel="stylesheet";l.href=h[i];l.media="print";l.onload=function(){this.media="all"};document.head.appendChild(l);}})();`,
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
        <style
          dangerouslySetInnerHTML={{
            __html:
              'html{-webkit-text-size-adjust:100%}body{margin:0;background:#fff;color:#171717;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}a{color:inherit;text-decoration:none}img,svg{display:block;max-width:100%}button{font:inherit}',
          }}
        />
        <HeadContent />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <Outlet />
          <LiveChat />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
