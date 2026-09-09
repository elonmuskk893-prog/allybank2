import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/auth/2fa/page";

export const Route = createFileRoute("/auth/2fa/")({
  component: Page,
});
