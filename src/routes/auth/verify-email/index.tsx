import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/auth/verify-email/page";

export const Route = createFileRoute("/auth/verify-email/")({
  component: Page,
});
