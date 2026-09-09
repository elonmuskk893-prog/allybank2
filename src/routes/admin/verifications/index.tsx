import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/verifications/page";

export const Route = createFileRoute("/admin/verifications/")({
  component: Page,
});
