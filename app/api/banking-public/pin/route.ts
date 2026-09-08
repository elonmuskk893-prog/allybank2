import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() => db.setPin({ current_password: body.current_password, pin: String(body.pin ?? "") }));
}