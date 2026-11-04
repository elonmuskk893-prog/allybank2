import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { LiveChat } from "@/components/live-chat";
import { SmartsuppChat } from "@/components/smartsupp-chat";
import { renderErrorPage } from "@/lib/error-page";
import "@/styles.css";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Account Dashboard — Secure Access" },
      {
        name: "description",
        content: "Manage transfers, cards, and account activity in one secure place.",
      },
      { property: "og:title", content: "Account Dashboard — Secure Access" },
      {
        property: "og:description",
        content: "Transfers, cards, and account activity in one secure place.",
      },
      { property: "og:type", content: "website" },
      { name: "theme-color", content: "#0ea5e9" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Account Dashboard" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/favicon-256.png", type: "image/png", sizes: "256x256" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://cdnjs.cloudflare.com", crossOrigin: "anonymous" },
    ],
    scripts: [
      {
        // Load icon + webfont CSS without blocking the first paint.
        children: `(function(){var h=[["https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css","sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg=="],["https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap",""]];for(var i=0;i<h.length;i++){var l=document.createElement("link");l.rel="stylesheet";l.href=h[i][0];if(h[i][1]){l.integrity=h[i][1];l.crossOrigin="anonymous"}l.media="print";l.onload=function(){this.media="all"};document.head.appendChild(l);}})();`,
      },
    ],
  }),
  errorComponent: () => {
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
          <SmartsuppChat />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
