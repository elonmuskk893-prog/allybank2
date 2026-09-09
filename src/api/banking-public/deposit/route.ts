import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.createDeposit({
      amount: Number(body.amount),
      method: body.method ?? "bank_transfer",
      currency: body.currency,
    }),
  );
}