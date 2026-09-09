import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/privacy/page";

export const Route = createFileRoute("/privacy/")({
  component: Page,
});
