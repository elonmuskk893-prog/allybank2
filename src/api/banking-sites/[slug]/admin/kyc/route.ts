import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return route(() => db.adminKyc(searchParams.get("status") ?? undefined));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.adminUpdateUser({ id: body.user_id ?? body.id, kyc_status: body.status }),
  );
}
