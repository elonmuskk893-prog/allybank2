import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET() {
  return route(() => db.irsRefunds());
}
