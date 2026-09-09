import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/currencies/page";

export const Route = createFileRoute("/admin/currencies/")({
  component: Page,
});
