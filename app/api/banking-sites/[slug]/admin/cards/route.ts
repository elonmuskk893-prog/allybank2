import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET() {
  return route(() => db.adminCards());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    body.kind === "application"
      ? db.setCardApplicationStatus(body)
      : db.setCardStatus(body),
  );
}
