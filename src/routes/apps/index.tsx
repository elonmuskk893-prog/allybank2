import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/apps/page";

export const Route = createFileRoute("/apps/")({
  component: Page,
});
