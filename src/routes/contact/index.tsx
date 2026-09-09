import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/contact/page";

export const Route = createFileRoute("/contact/")({
  component: Page,
});
