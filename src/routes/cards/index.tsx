import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/cards/page";

export const Route = createFileRoute("/cards/")({
  component: Page,
});
