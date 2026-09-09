import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/transfer/page";

export const Route = createFileRoute("/transfer/")({
  component: Page,
});
