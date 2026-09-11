import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AllyBank — Secure Online Banking" },
      {
        name: "description",
        content:
          "Secure online banking with instant transfers, cards, loans, and 24/7 account access.",
      },
      { property: "og:title", content: "AllyBank — Secure Online Banking" },
      {
        property: "og:description",
        content:
          "Open an account, move money worldwide, and manage your finances securely with AllyBank.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:image",
        content: "https://allybank2.vercel.app/allybank-og.jpg",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:image",
        content: "https://allybank2.vercel.app/allybank-og.jpg",
      },
    ],
  }),
  component: Page,
});
