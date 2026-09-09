import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  return route(() => db.register(body));
}