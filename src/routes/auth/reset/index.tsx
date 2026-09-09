import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/auth/reset/page";

export const Route = createFileRoute("/auth/reset/")({
  component: Page,
});
