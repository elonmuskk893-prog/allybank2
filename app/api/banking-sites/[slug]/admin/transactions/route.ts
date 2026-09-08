import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  return route(() => db.adminTransactions(Number(searchParams.get("limit") ?? 100)));
}
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  return route(() => db.adminDeleteTransaction(searchParams.get("id") ?? undefined));
}
