import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  return route(() =>
    db.adminUsers(
      searchParams.get("q") ?? searchParams.get("search") ?? undefined,
      searchParams.get("status") ?? undefined,
    ),
  );
}