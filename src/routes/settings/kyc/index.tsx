import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/settings/kyc/page";

export const Route = createFileRoute("/settings/kyc/")({
  component: Page,
});
