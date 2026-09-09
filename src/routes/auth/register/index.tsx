import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/auth/register/page";

export const Route = createFileRoute("/auth/register/")({
  component: Page,
});
