import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/users/page";

export const Route = createFileRoute("/admin/users/")({
  component: Page,
});
