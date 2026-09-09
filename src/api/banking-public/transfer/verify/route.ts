import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.verifyTransfer({
      transfer_id: String(body.transfer_id ?? ""),
      code: String(body.code ?? ""),
    }),
  );
}