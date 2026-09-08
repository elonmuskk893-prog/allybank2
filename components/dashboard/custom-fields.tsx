"use client";

import { useRef, useState } from "react";
import { bankFetch } from "@/lib/api";

export interface CustomField {
  id: string;
  label: string;
  role?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  value?: string | null;
}

export interface CustomFieldValues {
  [id: string]: string;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 bytes";
  if (bytes < 1024) return `${Math.round(bytes)} bytes`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  const digits = Number.isInteger(size) ? String(size) : size.toFixed(1);
  return `${digits} ${units[unit]}`;
}

function fileSizeMessage(
  size: number,
  limit: number,
  label = "file",
): string {
  return `That ${label} is ${formatBytes(size)} — the limit is ${formatBytes(
    limit,
  )}. Please compress it or upload a smaller one.`;
}

export function validateFileSize(
  file: File,
  limit: number,
  label = "file",
): string | null {
  return file && file.size > limit ? fileSizeMessage(file.size, limit, label) : null;
}

function putFile(
  url: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader(
      "content-type",
      file.type || "application/octet-stream",
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`upload_failed_${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("upload_blocked"));
    xhr.send(file);
  });
}

/** Upload a file to Supabase Storage via the API and return its public URL. */
export async function uploadFile(file: File): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/banking-public/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) return null;
  try {
    const json = (await res.json()) as { data?: { publicUrl?: string } };
    return json.data?.publicUrl ?? null;
  } catch {
    return null;
  }
}

/** First required input field that is missing a value, or null. */
export function missingFieldLabel(
  fields: CustomField[],
  values: CustomFieldValues,
): string | null {
  for (const field of fields) {
    if (
      field.role === "input" &&
      field.required &&
      !(values[field.id] ?? "").toString().trim()
    ) {
      return field.label;
    }
  }
  return null;
}

const LIGHT = {
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  inputBg: "#ffffff",
  cardBg: "#f8fafc",
  accent: "#2563eb",
};

const DARK = {
  text: "#e8eaed",
  muted: "#9aa0ab",
  border: "#2a2f36",
  inputBg: "rgba(255,255,255,0.03)",
  cardBg: "rgba(255,255,255,0.03)",
  accent: "#22c55e",
};

function FieldFile({
  field,
  value,
  onChange,
  upload,
  palette,
}: {
  field: CustomField;
  value: string;
  onChange: (value: string) => void;
  upload: (file: File) => Promise<string | null>;
  palette: (typeof LIGHT) & { accent: string };
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file?: File) {
    if (!file || !upload) return;
    const sizeError = validateFileSize(file, 8388608, field.label);
    if (sizeError) return setError(sizeError);
    setError(null);
    setBusy(true);
    const url = await upload(file);
    setBusy(false);
    if (url) onChange(url);
    else setError("Upload failed — try again.");
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        style={{
          width: "100%",
          borderRadius: 10,
          padding: "11px 12px",
          fontSize: 14,
          cursor: busy ? "wait" : "pointer",
          color: value ? palette.text : palette.muted,
          background: palette.inputBg,
          border: `1px dashed ${value ? palette.accent : palette.border}`,
          textAlign: "left",
        }}
      >
        {busy
          ? "Uploading…"
          : value
            ? "✓ File uploaded — tap to replace"
            : `Upload ${field.label.toLowerCase()}`}
      </button>
      {error && (
        <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{error}</p>
      )}
    </>
  );
}

interface CustomFieldsEditorProps {
  defs: CustomField[];
  values: CustomFieldValues;
  onChange: (id: string, value: string) => void;
  upload: (file: File) => Promise<string | null>;
  dark?: boolean;
  accent?: string;
}

/** Render custom fields (input / display / file / select) for payment methods. */
export function CustomFieldsEditor({
  defs,
  values,
  onChange,
  upload,
  dark = false,
  accent,
}: CustomFieldsEditorProps) {
  const theme = dark ? DARK : LIGHT;
  const palette = accent ? { ...theme, accent } : theme;
  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 10,
    padding: "11px 12px",
    fontSize: 14,
    color: palette.text,
    background: palette.inputBg,
    border: `1px solid ${palette.border}`,
    outline: "none",
  };
  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: palette.muted,
    marginBottom: 6,
    display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {defs.map((field) => {
        if (field.role === "display") {
          const value = field.value ?? "";
          if (!value) return null;
          return (
            <div
              key={field.id}
              style={{
                border: `1px solid ${palette.border}`,
                borderRadius: 10,
                padding: "10px 12px",
                background: palette.cardBg,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: palette.muted,
                  marginBottom: field.type === "file" ? 8 : 2,
                }}
              >
                {field.label}
              </div>
              {field.type === "file" ? (
                <img
                  src={value}
                  alt={field.label}
                  style={{
                    maxWidth: 180,
                    maxHeight: 180,
                    borderRadius: 8,
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: palette.text,
                    wordBreak: "break-word",
                  }}
                >
                  {value}
                </div>
              )}
            </div>
          );
        }
        return (
          <div key={field.id}>
            <label style={labelStyle}>
              {field.label}
              {field.required ? (
                <span style={{ color: "#ef4444" }}> *</span>
              ) : (
                <span style={{ color: palette.muted, fontWeight: 400 }}>
                  {" (optional)"}
                </span>
              )}
            </label>
            {field.type === "file" ? (
              <FieldFile
                field={field}
                value={values[field.id] ?? ""}
                onChange={(v) => onChange(field.id, v)}
                upload={upload}
                palette={palette}
              />
            ) : field.type === "select" ? (
              <select
                value={values[field.id] ?? ""}
                onChange={(e) => onChange(field.id, e.target.value)}
                style={inputStyle}
              >
                <option value="">Select…</option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={
                  field.type === "number"
                    ? "number"
                    : field.type === "date"
                      ? "date"
                      : "text"
                }
                value={values[field.id] ?? ""}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder ?? ""}
                autoComplete="off"
                style={inputStyle}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
