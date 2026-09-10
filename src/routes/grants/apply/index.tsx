import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/grants/apply/page";

export const Route = createFileRoute("/grants/apply/")({
  component: Page,
});
