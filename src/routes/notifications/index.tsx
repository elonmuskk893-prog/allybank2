import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/notifications/page";

export const Route = createFileRoute("/notifications/")({
  component: Page,
});
