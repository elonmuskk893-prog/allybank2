import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/live-chat/page";

export const Route = createFileRoute("/admin/live-chat/")({
  component: Page,
});
