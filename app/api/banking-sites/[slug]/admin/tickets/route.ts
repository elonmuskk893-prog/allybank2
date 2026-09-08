import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) return route(() => db.adminTicketDetail(id));
  return route(() => db.adminTickets(searchParams.get("status") ?? undefined));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(async () => {
    if (body.action === "reply") return db.adminReplyTicket(body.id, body.body);
    if (body.action === "delete") return db.deleteTicket(body.id);
    return db.setTicketStatus({ id: body.id, status: body.status });
  });
}
