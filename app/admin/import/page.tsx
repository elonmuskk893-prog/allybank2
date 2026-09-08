"use client";

import { useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";

interface ImportResult {
  created: string[];
  errors: { email?: string; error: string }[];
}

function parseCsv(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.toLowerCase().startsWith("email"))
    .map((line) => {
      const [email, first_name, last_name, password] = line.split(",").map((c) => c.trim());
      return { email, first_name, last_name, password };
    });
}

function ImportAdmin() {
  const { slug } = useAdmin();
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    const rows = parseCsv(csv);
    if (rows.length === 0) {
      setError("Paste at least one row (email, first name, last name, optional password).");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await adminFetch<ImportResult>(slug, "/import-users", {
      method: "POST",
      body: JSON.stringify({ rows }),
    });
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? "Import failed.");
      return;
    }
    setResult(res.data);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Import users</h1>
      <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
        Paste one member per line — <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">email, first name, last name, password</code>
        {" "}（password optional; a temporary one is generated). Accounts are created immediately verified. Maximum 100 rows per import.
      </p>
      <textarea
        rows={10}
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder={"jane@example.com,Jane,Doe\njohn@example.com,John,Smith,S3curePass!"}
        className="w-full rounded-xl border border-gray-200 bg-white p-3 font-mono text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        onClick={run}
        disabled={busy}
        className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "var(--brand)" }}
      >
        {busy ? "Importing…" : "Import users"}
      </button>

      {result && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Created ({result.created.length})
            </div>
            <ul className="mt-2 space-y-1 text-sm text-emerald-800 dark:text-emerald-200">
              {result.created.map((email) => (
                <li key={email}>{email}</li>
              ))}
              {result.created.length === 0 && <li className="text-gray-500">None</li>}
            </ul>
          </div>
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/60 p-4 dark:border-rose-900/40 dark:bg-rose-950/30">
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Failed ({result.errors.length})
            </div>
            <ul className="mt-2 space-y-1 text-sm text-rose-800 dark:text-rose-200">
              {result.errors.map((e, i) => (
                <li key={i}>
                  {e.email ?? "(unknown)"} — {e.error}
                </li>
              ))}
              {result.errors.length === 0 && <li className="text-gray-500">None</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminImportPage() {
  return (
    <AdminShell>
      <ImportAdmin />
    </AdminShell>
  );
}
