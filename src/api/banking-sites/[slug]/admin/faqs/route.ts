import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET() {
  return route(() => db.adminFaqs());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() => db.saveFaq(body));
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  return route(() => db.deleteFaq(searchParams.get("id") ?? undefined));
}
