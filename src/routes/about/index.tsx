import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/about/page";

export const Route = createFileRoute("/about/")({
  component: Page,
});
