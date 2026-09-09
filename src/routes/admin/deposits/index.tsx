import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/deposits/page";

export const Route = createFileRoute("/admin/deposits/")({
  component: Page,
});
