import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/cards/apply/page";

export const Route = createFileRoute("/cards/apply/")({
  component: Page,
});
