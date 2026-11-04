import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Account Dashboard — Secure Access" },
      {
        name: "description",
        content:
          "Manage transfers, cards, and account activity in one secure place.",
      },
      { property: "og:title", content: "Account Dashboard — Secure Access" },
      {
        property: "og:description",
        content:
          "Transfers, cards, and account activity in one secure place.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:image",
        content: "/og-image.jpg",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:image",
        content: "/og-image.jpg",
      },
    ],
  }),
  component: Page,
});
