import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";
import { cookies } from "@/lib/next/headers";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`auth:2fa:${ip}`);
  if (!limit.allowed) {
    return new Response(JSON.stringify({ error: "too_many_requests" }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
  }
  const body = await request.json().catch(() => ({}));
  return route(async () => {
    const store = await cookies();
    const challenge = store.get("pending_challenge")?.value;
    if (!challenge) {
      throw new Error("missing_challenge");
    }
    await db.login2fa({ challenge, code: String(body.code ?? "") });
    store.delete("pending_challenge");
    return { ok: true };
  });
}
