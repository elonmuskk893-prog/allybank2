import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/services/loans/page";

export const Route = createFileRoute("/services/loans/")({
  component: Page,
});
