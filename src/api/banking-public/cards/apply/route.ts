import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return route(() =>
    db.applyCard({
      card_brand: body.card_brand,
      currency: body.currency,
      card_level: body.card_level,
      daily_limit: body.daily_limit != null ? Number(body.daily_limit) : undefined,
      billing_address: body.billing_address,
      billing_city: body.billing_city,
      billing_zip: body.billing_zip,
    }),
  );
}