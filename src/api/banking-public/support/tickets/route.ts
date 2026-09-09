import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET() {
  return route(() => db.supportTickets());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.createSupportTicket({
      category: body.category ?? "general",
      subject: body.subject ?? "",
      message: body.message ?? "",
    }),
  );
}