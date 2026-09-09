import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";
import { cookies } from "@/lib/next/headers";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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