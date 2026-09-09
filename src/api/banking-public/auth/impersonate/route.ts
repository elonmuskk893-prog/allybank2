import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

/** Admin starts impersonating a member (requires admin session). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() => db.startImpersonation(body));
}

/** Ends the impersonation session and clears the cookie. */
export async function DELETE() {
  return route(() => db.endImpersonation());
}
