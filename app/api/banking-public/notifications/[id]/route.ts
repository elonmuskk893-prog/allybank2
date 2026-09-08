import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return route(() => db.deleteNotification(id));
}