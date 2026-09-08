import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET() {
  return route(() => db.loans());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.applyLoan({
      amount: Number(body.amount),
      interest_rate: Number(body.interest_rate ?? 0),
      term_months: body.term_months ? Number(body.term_months) : undefined,
    }),
  );
}