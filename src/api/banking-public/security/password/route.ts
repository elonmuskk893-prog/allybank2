import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.changePassword({
      current_password: String(body.current_password ?? ""),
      new_password: String(body.new_password ?? ""),
    }),
  );
}
