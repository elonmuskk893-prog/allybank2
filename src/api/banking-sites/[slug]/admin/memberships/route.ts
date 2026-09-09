import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return route(() =>
    db.adminMemberships(
      searchParams.get("q") ?? undefined,
      searchParams.get("status") ?? undefined,
    ),
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() => db.saveMembership(body));
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  return route(() => db.deleteMembership(searchParams.get("id") ?? undefined));
}
