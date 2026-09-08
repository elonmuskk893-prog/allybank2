import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { db as supabaseDb } from "@/lib/db/supabase";
import { db as mockDb } from "@/lib/db/mock";
import type * as schema from "@/lib/db/schema";

/**
 * Unified data-access layer.
 *
 * When Supabase env vars are configured, every call goes to Postgres behind
 * row-level security. Otherwise an in-memory store backs the same interface so
 * the app is browsable/usable locally without a database.
 */
export const db: typeof supabaseDb = isSupabaseConfigured() ? supabaseDb : mockDb;

export type { schema };

export function usingMock() {
  return !isSupabaseConfigured();
}