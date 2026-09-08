import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return route(() => db.createSupportMessage(id, String(body.body ?? "")));
}