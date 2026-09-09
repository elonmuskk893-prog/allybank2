import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/withdrawals/page";

export const Route = createFileRoute("/admin/withdrawals/")({
  component: Page,
});
