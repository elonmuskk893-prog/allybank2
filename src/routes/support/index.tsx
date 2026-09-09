import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/support/page";

export const Route = createFileRoute("/support/")({
  component: Page,
});
