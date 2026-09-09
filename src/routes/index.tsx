import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/page";

export const Route = createFileRoute("/")({
  component: Page,
});
