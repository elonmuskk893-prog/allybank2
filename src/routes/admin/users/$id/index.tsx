import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/users/[id]/page";

export const Route = createFileRoute("/admin/users/$id/")({
  component: Page,
});
