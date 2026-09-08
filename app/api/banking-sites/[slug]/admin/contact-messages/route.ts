import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return route(() => db.adminContactMessages(searchParams.get("handled") ?? undefined));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() => db.setContactHandled(body.id, body.handled ?? true));
}
