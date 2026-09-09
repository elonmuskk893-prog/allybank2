import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/settings/security/page";

export const Route = createFileRoute("/settings/security/")({
  component: Page,
});
