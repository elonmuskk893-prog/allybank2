import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.createTransfer({
      amount: Number(body.amount),
      currency: body.currency,
      beneficiary_id: body.beneficiary_id,
      name: body.name,
      account_number: body.account_number,
      note: body.note,
      recipient_email: body.recipient_email,
      pin: body.pin != null ? String(body.pin) : undefined,
      narration: body.narration,
    }),
  );
}