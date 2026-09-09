import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/faq/page";

export const Route = createFileRoute("/admin/faq/")({
  component: Page,
});
