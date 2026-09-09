import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/leads/page";

export const Route = createFileRoute("/admin/leads/")({
  component: Page,
});
