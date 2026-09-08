import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return route(() =>
    db.adminWithdrawals({
      search: searchParams.get("q") ?? searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    }),
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(async () => {
    if (body.action === "generate-code") {
      return db.generateWithdrawalCode({ id: body.id });
    }
    return db.setWithdrawalStatus(body);
  });
}
