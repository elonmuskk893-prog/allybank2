import { DbError } from "@/lib/db/error";

const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["application/pdf", "pdf"],
]);

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

function matchesType(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg" || type === "image/jpg") return startsWith(bytes, [0xff, 0xd8, 0xff]);
  if (type === "image/png") {
    return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (type === "image/gif") return ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a";
  if (type === "image/webp") return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
  if (type === "application/pdf") return ascii(bytes, 0, 5) === "%PDF-";
  return false;
}

export function validateUpload(input: { filename?: string; contentType?: string }, bytes: Uint8Array) {
  if (bytes.length === 0) throw new DbError("invalid_file", "The uploaded file is empty.");
  if (bytes.length > 10 * 1024 * 1024) {
    throw new DbError("file_too_large", "Files must be 10MB or smaller.");
  }
  const contentType = (input.contentType ?? "").split(";")[0].trim().toLowerCase();
  const extension = ALLOWED_TYPES.get(contentType);
  if (!extension) {
    throw new DbError("invalid_file_type", "Upload a JPEG, PNG, WebP, GIF or PDF file.");
  }
  if (!matchesType(contentType, bytes)) {
    throw new DbError("invalid_file_type", "The file contents do not match its type.");
  }
  const base = (input.filename ?? "upload")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w.\-]+/g, "_")
    .slice(0, 64) || "upload";
  return { contentType, filename: `${base}.${extension}` };
}
