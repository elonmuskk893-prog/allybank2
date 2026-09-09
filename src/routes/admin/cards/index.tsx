import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/cards/page";

export const Route = createFileRoute("/admin/cards/")({
  component: Page,
});
