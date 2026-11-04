import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";
import { cookies } from "@/lib/next/headers";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`auth:register:${ip}`);
  if (!limit.allowed) {
    return new Response(JSON.stringify({ error: "too_many_requests" }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
  }
  const body = await request.json().catch(() => ({}));
  return route(async () => {
    const result = await db.register(body);
    if (result.needs_email_verification && result.email) {
      const store = await cookies();
      store.set("sb_pending_verify", result.email, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 15 * 60,
      });
    }
    return {
      needs_email_verification: Boolean(result.needs_email_verification),
    };
  });
}
