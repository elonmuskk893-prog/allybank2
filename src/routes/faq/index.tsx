import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/faq/page";

export const Route = createFileRoute("/faq/")({
  component: Page,
});
