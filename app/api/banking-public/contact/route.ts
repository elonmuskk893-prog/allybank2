import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.submitContact({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      subject: body.subject === undefined ? undefined : String(body.subject),
      message: String(body.message ?? ""),
    }),
  );
}