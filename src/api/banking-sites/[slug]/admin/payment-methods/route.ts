import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET() {
  return route(() => db.adminPaymentMethods());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (body.action === "toggle" && body.id) {
    return route(() => db.adminTogglePaymentMethod({ id: body.id, enabled: Boolean(body.enabled) }));
  }
  if (body.action === "delete" && body.id) {
    return route(() => db.deletePaymentMethod(body.id));
  }
  return route(() => db.savePaymentMethod(body));
}
