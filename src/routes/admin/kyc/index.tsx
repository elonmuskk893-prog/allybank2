import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/kyc/page";

export const Route = createFileRoute("/admin/kyc/")({
  component: Page,
});
