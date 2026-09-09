import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/contact-messages/page";

export const Route = createFileRoute("/admin/contact-messages/")({
  component: Page,
});
