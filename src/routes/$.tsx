import { createFileRoute, useParams } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/$")({
  component: PlaceholderPage,
});

function PlaceholderPage() {
  const params = useParams({ strict: false }) as { _splat?: string };
  return <ComingSoon page={params._splat ?? ""} />;
}
