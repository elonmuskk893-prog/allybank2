import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return route(() => db.paymentMethods(searchParams.get("for") ?? "deposit"));
}