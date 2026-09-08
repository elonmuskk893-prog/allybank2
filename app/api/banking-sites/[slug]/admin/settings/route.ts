import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET() {
  return route(() => db.getSiteSettings());
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() => db.updateSiteSettings(body));
}
