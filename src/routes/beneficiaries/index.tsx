import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/beneficiaries/page";

export const Route = createFileRoute("/beneficiaries/")({
  component: Page,
});
