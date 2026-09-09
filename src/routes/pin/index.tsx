import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/pin/page";

export const Route = createFileRoute("/pin/")({
  component: Page,
});
