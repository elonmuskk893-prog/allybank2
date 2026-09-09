import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/crypto-assets/page";

export const Route = createFileRoute("/admin/crypto-assets/")({
  component: Page,
});
