import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/services/business/page";

export const Route = createFileRoute("/services/business/")({
  component: Page,
});
