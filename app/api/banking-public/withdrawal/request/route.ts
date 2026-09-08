import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.requestWithdrawal({
      amount: Number(body.amount),
      method_id: body.method_id,
      custom: body.custom,
      destination: body.destination,
      pin: body.pin != null ? String(body.pin) : undefined,
    }),
  );
}