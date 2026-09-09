import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/terms/page";

export const Route = createFileRoute("/terms/")({
  component: Page,
});
