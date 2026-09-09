import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/card-settings/page";

export const Route = createFileRoute("/admin/card-settings/")({
  component: Page,
});
