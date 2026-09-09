import { ComingSoon } from "@/components/coming-soon";

export default async function PlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  return <ComingSoon page={slug.join("/")} />;
}