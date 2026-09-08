import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { id } = await params;
  return route(() => db.adminUserDetail(id));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return route(() => db.adminUpdateUser({ ...body, id }));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { id } = await params;
  return route(() => db.adminDeleteUser(id));
}
