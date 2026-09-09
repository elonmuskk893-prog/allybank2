import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/loans/page";

export const Route = createFileRoute("/loans/")({
  component: Page,
});
