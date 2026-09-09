import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/transactions/page";

export const Route = createFileRoute("/transactions/")({
  component: Page,
});
