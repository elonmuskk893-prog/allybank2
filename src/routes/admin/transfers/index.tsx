import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/transfers/page";

export const Route = createFileRoute("/admin/transfers/")({
  component: Page,
});
