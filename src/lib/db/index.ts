import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { db as supabaseDb } from "@/lib/db/supabase";
import { db as mockDb } from "@/lib/db/mock";
import type * as schema from "@/lib/db/schema";

/**
 * Unified data-access layer.
 *
 * Mock data is deliberately opt-in. A deployed app with missing credentials
 * must fail closed instead of appearing healthy while serving fake balances.
 */
const allowMockDatabase = process.env["ALLOW_MOCK_DB"] === "true";
const hasDatabase = isSupabaseConfigured();

if (!hasDatabase && !allowMockDatabase) {
  throw new Error(
    "Backend configuration is missing. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.",
  );
}

export const db: typeof supabaseDb = hasDatabase ? supabaseDb : mockDb;

export type { schema };

export function usingMock() {
  return !hasDatabase;
}