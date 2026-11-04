import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`auth:resend:${ip}`);
  if (!limit.allowed) {
    return new Response(JSON.stringify({ error: "too_many_requests" }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
  }
  const body = await request.json().catch(() => ({}));
  return route(() => db.resendVerifyCode({ email: body?.email ? String(body.email) : undefined }));
}
