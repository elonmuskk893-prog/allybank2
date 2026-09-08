import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";

export async function GET() {
  return route(() => db.adminStorageAssets());
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  return route(() => db.deleteStorageAsset(searchParams.get("path") ?? undefined));
}
