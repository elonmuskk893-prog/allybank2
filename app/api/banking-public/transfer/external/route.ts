import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.createExternalTransfer({
      scope: body.scope,
      method: body.method,
      beneficiary_name: body.beneficiary_name,
      account_number: body.account_number,
      bank_name: body.bank_name,
      account_type: body.account_type,
      swift: body.swift,
      routing: body.routing,
      amount: Number(body.amount),
      narration: body.narration,
      pin: body.pin != null ? String(body.pin) : undefined,
      save_beneficiary: body.save_beneficiary,
      beneficiary_id: body.beneficiary_id,
    }),
  );
}