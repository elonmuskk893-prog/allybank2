import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST() {
  return route(() => db.logout());
}