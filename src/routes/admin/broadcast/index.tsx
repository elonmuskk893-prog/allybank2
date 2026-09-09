import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/broadcast/page";

export const Route = createFileRoute("/admin/broadcast/")({
  component: Page,
});
