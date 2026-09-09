import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET() {
  return route(() => db.grants());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.applyGrant({
      program: body.program,
      amount: body.amount ? Number(body.amount) : undefined,
    }),
  );
}