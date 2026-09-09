import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/grants/page";

export const Route = createFileRoute("/grants/")({
  component: Page,
});
