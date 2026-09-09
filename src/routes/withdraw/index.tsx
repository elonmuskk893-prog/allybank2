import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/withdraw/page";

export const Route = createFileRoute("/withdraw/")({
  component: Page,
});
