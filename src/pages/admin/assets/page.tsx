"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { TableWrap } from "@/components/admin/ui";

interface StoredFile {
  path: string;
  name: string;
  size: number;
  created_at: string | null;
  public_url: string;
}

function formatSize(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${Number.isInteger(v) ? v : v.toFixed(1)} ${units[i]}`;
}

function AssetsAdmin() {
  const { slug } = useAdmin();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch<{ files: StoredFile[]; total_folders: number }>(slug, "/storage-assets");
    setLoading(false);
    if (res.ok && res.data) setFiles(res.data.files ?? []);
    else setError(res.error ?? "Could not list files.");
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (path: string) => {
    await adminFetch(slug, `/storage-assets?path=${encodeURIComponent(path)}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Assets</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Files uploaded through the platform (profile photos, deposit proofs, KYC documents).
        </p>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading ? (
        <div className="p-8 text-center text-sm text-gray-500">Loading files…</div>
      ) : (
        <TableWrap empty={files.length === 0}>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">File</th>
                <th className="px-4 py-2.5 text-left font-medium">Size</th>
                <th className="px-4 py-2.5 text-left font-medium">Uploaded</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.path} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                  <td className="max-w-xs px-4 py-3">
                    <div className="truncate font-mono text-xs font-medium text-gray-900 dark:text-gray-100">{f.name}</div>
                    <div className="text-[10px] text-gray-400">{f.path}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{formatSize(f.size)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {f.created_at ? new Date(f.created_at).toLocaleString() : "--"}
                  </td>
                  <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                    <a
                      href={f.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                    >
                      View
                    </a>
                    <button
                      onClick={() => remove(f.path)}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </div>
  );
}

export default function AdminAssetsPage() {
  return (
    <AdminShell>
      <AssetsAdmin />
    </AdminShell>
  );
}
