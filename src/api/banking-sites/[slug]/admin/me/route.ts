import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return route(() => db.adminMe(slug));
}