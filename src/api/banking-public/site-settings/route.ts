import { ok } from "@/lib/db/handlers";
import { db } from "@/lib/db";

/** Public site settings consumed by the user-facing website (no auth). */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  try {
    const data = await db.publicSiteSettings();
    return ok({ ...data, origin });
  } catch {
    // Never break the site because settings are unavailable.
    return ok({
      name: null,
      brand_color: null,
      logo_url: null,
      contact: {},
      live_chat: { enabled: false },
      features: {},
      origin,
    });
  }
}
