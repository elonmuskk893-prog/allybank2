import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/assets/page";

export const Route = createFileRoute("/admin/assets/")({
  component: Page,
});
