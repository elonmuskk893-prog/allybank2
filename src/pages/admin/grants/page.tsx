"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";

interface GrantRow {
  id: string;
  user_id: string;
  email?: string;
  program: string;
  amount: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ["", "pending", "approved", "rejected", "completed"];

function statusPill(status: string) {
  const map: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300";
}

interface ProgramRow {
  id: string;
  title: string;
  description: string;
  icon: string;
  tint: string;
  bullets: string[];
  max_amount: string | number | null;
  sort_order: number;
  enabled: boolean;
}

const TINTS = ["blue", "purple", "green", "red", "orange", "teal"];

const BLANK: ProgramRow = {
  id: "",
  title: "",
  description: "",
  icon: "fa-solid fa-hand-holding-dollar",
  tint: "blue",
  bullets: [],
  max_amount: null,
  sort_order: 0,
  enabled: true,
};

const field =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

/**
 * Grant programs advertised on the public website. Saving here changes
 * /services/grants immediately — enable, edit, reorder or remove.
 */
function ProgramsPanel({ slug }: { slug: string }) {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [draft, setDraft] = useState<ProgramRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch<{ programs: ProgramRow[] }>(slug, "/grant-programs");
    if (res.ok && res.data?.programs) setPrograms(res.data.programs);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (program: ProgramRow) => {
    setBusy(true);
    setNote(null);
    const res = await adminFetch(slug, "/grant-programs", {
      method: "POST",
      body: JSON.stringify({ ...program, id: program.id || undefined }),
    });
    setBusy(false);
    if (!res.ok) {
      setNote(res.error ?? "Could not save that program.");
      return;
    }
    setDraft(null);
    setNote("Saved — the website is updated.");
    await load();
  };

  const remove = async (id: string) => {
    setBusy(true);
    await adminFetch(slug, `/grant-programs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setBusy(false);
    await load();
  };

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Programs on the website</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            These appear on the public Grants page. Disable one and it disappears from the website.
          </p>
        </div>
        <button
          onClick={() => setDraft({ ...BLANK, sort_order: programs.length + 1 })}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          Add program
        </button>
      </div>

      {note && <p className="text-sm text-emerald-600 dark:text-emerald-400">{note}</p>}

      <div className="space-y-2">
        {programs.length === 0 && (
          <p className="text-sm text-gray-500">No programs yet — the website shows nothing here.</p>
        )}
        {programs.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 dark:border-gray-700/60"
          >
            <i className={`${p.icon} w-5 text-center text-gray-500`} />
            <span className="font-medium text-gray-900 dark:text-gray-100">{p.title}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                p.enabled
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-300"
              }`}
            >
              {p.enabled ? "Visible" : "Hidden"}
            </span>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => save({ ...p, enabled: !p.enabled })}
                disabled={busy}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
              >
                {p.enabled ? "Hide" : "Show"}
              </button>
              <button
                onClick={() => setDraft(p)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                Edit
              </button>
              <button
                onClick={() => remove(p.id)}
                disabled={busy}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {draft && (
        <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <input
            className={field}
            placeholder="Program title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <textarea
            className={field}
            rows={3}
            placeholder="Short description shown on the website"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <textarea
            className={field}
            rows={3}
            placeholder={"One highlight per line\nNo collateral required\nFlexible repayment terms"}
            value={draft.bullets.join("\n")}
            onChange={(e) => setDraft({ ...draft, bullets: e.target.value.split("\n") })}
          />
          <div className="grid gap-3 sm:grid-cols-4">
            <input
              className={field}
              placeholder="Icon (fa-solid fa-store)"
              value={draft.icon}
              onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
            />
            <select
              className={field}
              value={draft.tint}
              onChange={(e) => setDraft({ ...draft, tint: e.target.value })}
            >
              {TINTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              className={field}
              placeholder="Max amount"
              value={draft.max_amount == null ? "" : String(draft.max_amount)}
              onChange={(e) => setDraft({ ...draft, max_amount: e.target.value })}
            />
            <input
              className={field}
              placeholder="Order"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
              className="h-4 w-4"
            />
            Show on the public website
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => save({ ...draft, bullets: draft.bullets.filter((b) => b.trim()) })}
              disabled={busy || !draft.title.trim()}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              Save program
            </button>
            <button
              onClick={() => setDraft(null)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function AdminGrants() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<GrantRow[]>([]);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await adminFetch<{ grants: GrantRow[] }>(slug, `/grants?${params}`);
    if (res.ok && res.data?.grants) setRows(res.data.grants);
  }, [slug, status]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, nextStatus: string) => {
    setBusyId(id);
    await adminFetch(slug, "/grants", {
      method: "POST",
      body: JSON.stringify({ id, status: nextStatus }),
    });
    await load();
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Grants</h1>

      <ProgramsPanel slug={slug} />

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Applications</h2>
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-gray-200/70 bg-white backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No grant applications found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">User</th>
                <th className="px-4 py-2.5 text-left font-medium">Program</th>
                <th className="px-4 py-2.5 text-left font-medium">Amount</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-black/[0.02] dark:border-gray-700/60 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.email ?? row.user_id}</td>
                  <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{row.program.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                    {row.amount ? Number(row.amount).toLocaleString() : "--"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusPill(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                    {row.status === "pending" ? (
                      <>
                        <button
                          disabled={busyId === row.id}
                          onClick={() => act(row.id, "approved")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={busyId === row.id}
                          onClick={() => act(row.id, "rejected")}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AdminGrantsPage() {
  return (
    <AdminShell>
      <AdminGrants />
    </AdminShell>
  );
}
