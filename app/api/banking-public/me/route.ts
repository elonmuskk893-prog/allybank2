import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET() {
  return route(() => db.me());
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.updateProfile({
      first_name: body.first_name,
      last_name: body.last_name,
      phone: body.phone,
      photo_url: body.photo_url,
    }),
  );
}
