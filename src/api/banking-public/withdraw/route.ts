import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.createWithdrawal({
      amount: Number(body.amount),
      method: body.method ?? "bank_transfer",
      account_number: body.account_number,
      currency: body.currency,
    }),
  );
}