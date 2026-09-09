import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/services/personal/page";

export const Route = createFileRoute("/services/personal/")({
  component: Page,
});
