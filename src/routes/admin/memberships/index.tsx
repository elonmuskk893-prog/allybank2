import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/memberships/page";

export const Route = createFileRoute("/admin/memberships/")({
  component: Page,
});
