import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() => db.updateProfile(body));
}