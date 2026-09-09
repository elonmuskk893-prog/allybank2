import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/services/grants/page";

export const Route = createFileRoute("/services/grants/")({
  component: Page,
});
