import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/irs-refunds/page";

export const Route = createFileRoute("/irs-refunds/")({
  component: Page,
});
