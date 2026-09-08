import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET() {
  return route(() => db.getAdminConfig("card_setup"));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() => db.setAdminConfig("card_setup", body.value ?? body));
}
