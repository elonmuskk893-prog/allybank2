import { route } from "@/lib/db/handlers";
import { db } from "@/lib/db";
import { DbError } from "@/lib/db/error";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    return route(async () => {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        throw new DbError("invalid_file", "No file was provided.", 400);
      }
      const data = Buffer.from(await file.arrayBuffer()).toString("base64");
      return db.uploadFile({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        data,
      });
    });
  }
  const body = await request.json().catch(() => ({}));
  return route(() => db.uploadFile(body));
}
