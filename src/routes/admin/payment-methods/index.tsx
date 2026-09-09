import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/payment-methods/page";

export const Route = createFileRoute("/admin/payment-methods/")({
  component: Page,
});
