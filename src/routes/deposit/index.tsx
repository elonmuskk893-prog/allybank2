import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/deposit/page";

export const Route = createFileRoute("/deposit/")({
  component: Page,
});
