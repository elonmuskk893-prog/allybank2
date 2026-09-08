import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return route(() => db.getAuditLogs(Number(searchParams.get("limit") ?? 100)));
}
