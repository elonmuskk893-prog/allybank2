import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: Request) {
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
      // Exposed only when the SMTP delivery failed, so local/dev flows still work.
      ...(result.dev_code ? { dev_code: result.dev_code } : {}),
    };
  });
}