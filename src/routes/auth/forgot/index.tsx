import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/auth/forgot/page";

export const Route = createFileRoute("/auth/forgot/")({
  component: Page,
});
