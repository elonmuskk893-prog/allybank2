import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Online Banking — Secure Account Access" },
      {
        name: "description",
        content:
          "Manage transfers, cards, loans, and account activity in one secure place.",
      },
      { property: "og:title", content: "Online Banking — Secure Account Access" },
      {
        property: "og:description",
        content:
          "Transfers, cards, loans, and account history in one secure place.",
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
