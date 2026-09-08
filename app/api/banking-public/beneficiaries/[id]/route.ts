import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return route(() => db.updateBeneficiary(id, body));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return route(() => db.deleteBeneficiary(id));
}