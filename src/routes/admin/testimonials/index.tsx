import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/testimonials/page";

export const Route = createFileRoute("/admin/testimonials/")({
  component: Page,
});
