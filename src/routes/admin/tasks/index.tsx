import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/tasks/page";

export const Route = createFileRoute("/admin/tasks/")({
  component: Page,
});
