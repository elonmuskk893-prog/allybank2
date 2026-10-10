import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { db as supabaseDb } from "@/lib/db/supabase";
import { db as mockDb } from "@/lib/db/mock";
import type * as schema from "@/lib/db/schema";

/**
 * Unified data-access layer.
 *
 * Mock data is deliberately opt-in. A deployed app with missing credentials
 * must fail closed instead of appearing healthy while serving fake balances.
 *
 * The configuration check is lazy (evaluated on first use, not at import
 * time) so that building the app never fails just because environment
 * variables are only available at runtime.
 */
function resolveDb(): typeof supabaseDb {
  const allowMockDatabase = process.env["ALLOW_MOCK_DB"] === "true";
  const hasDatabase = isSupabaseConfigured();
  if (!hasDatabase && !allowMockDatabase) {
    throw new Error(
      "Backend configuration is missing. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return hasDatabase ? supabaseDb : mockDb;
}

let resolved: typeof supabaseDb | null = null;

export const db: typeof supabaseDb = new Proxy({} as typeof supabaseDb, {
  get(_target, prop, receiver) {
    if (!resolved) resolved = resolveDb();
    return Reflect.get(resolved, prop, receiver);
  },
});

export type { schema };

export function usingMock() {
  return !isSupabaseConfigured();
}
