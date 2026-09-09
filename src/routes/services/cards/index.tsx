import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/services/cards/page";

export const Route = createFileRoute("/services/cards/")({
  component: Page,
});
