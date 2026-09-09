import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/grants/page";

export const Route = createFileRoute("/admin/grants/")({
  component: Page,
});
