"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Field, inputCls, Modal } from "@/components/admin/ui";
import { SafeHtml } from "@/components/dashboard/safe-html";

const SEGMENTS: { value: string; label: string }[] = [
  { value: "all", label: "All users" },
  { value: "active", label: "Active users" },
  { value: "inactive", label: "Inactive / disabled users" },
  { value: "email_verified", label: "Verified email" },
  { value: "email_unverified", label: "Unverified email" },
  { value: "kyc_verified", label: "KYC verified" },
  { value: "kyc_in_review", label: "KYC in review" },
];

interface PickerUser {
  id: string;
  email: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

function displayName(u: PickerUser) {
  return (
    u.full_name?.trim() ||
    `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() ||
    u.email
  );
}

function BroadcastAdmin() {
  const [mode, setMode] = useState<"segment" | "specific">("segment");
  const [users, setUsers] = useState<PickerUser[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sendEmail, setSendEmail] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [segment, setSegment] = useState("all");
  const [useHtml, setUseHtml] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    const res = await adminFetch<{ users: PickerUser[] }>(
      "teslamodel",
      `/users?q=${encodeURIComponent(search)}`,
    );
    if (res.ok && res.data?.users) setUsers(res.data.users);
  }, [search]);

  useEffect(() => {
    if (mode !== "specific") return;
    const timer = window.setTimeout(loadUsers, 250);
    return () => window.clearTimeout(timer);
  }, [mode, loadUsers]);

  const selectedUsers = useMemo(
    () => users.filter((u) => selected.includes(u.id)),
    [users, selected],
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const audienceLabel =
    mode === "specific"
      ? `${selected.length} selected member${selected.length === 1 ? "" : "s"}`
      : (SEGMENTS.find((s) => s.value === segment)?.label ?? segment);

  const canSend =
    Boolean(title.trim() && body.trim()) && (mode === "segment" || selected.length > 0);

  const send = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await adminFetch<{ recipients: number; emailed: number; segment: string }>(
      "teslamodel",
      "/broadcast",
      {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          link,
          segment: mode === "segment" ? segment : undefined,
          user_ids: mode === "specific" ? selected : undefined,
          send_email: sendEmail,
        }),
      },
    );
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? "Broadcast failed.");
      return;
    }
    const emailNote = sendEmail ? ` ${res.data.emailed} email${res.data.emailed === 1 ? "" : "s"} sent.` : "";
    setResult(
      `Delivered to ${res.data.recipients} member${res.data.recipients === 1 ? "" : "s"} (${audienceLabel}).${emailNote}`,
    );
    setTitle("");
    setBody("");
    setLink("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Broadcast</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Send an announcement to a selected audience segment&apos;s notification feed.
          Plain text or HTML is supported.
        </p>
      </div>

      <div className="max-w-3xl space-y-5 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
        {/* Audience */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["segment", "specific"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === m
                    ? "text-white"
                    : "text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-700/60"
                }`}
                style={mode === m ? { background: "var(--brand)" } : undefined}
              >
                {m === "segment" ? "Audience segment" : "Choose specific members"}
              </button>
            ))}
          </div>

          {mode === "segment" ? (
            <Field label="Audience segment">
              <select value={segment} onChange={(e) => setSegment(e.target.value)} className={inputCls}>
                {SEGMENTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="space-y-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputCls}
                placeholder="Search by name or email…"
              />
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
                {users.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">No members match that search.</p>
                ) : (
                  users.map((u) => (
                    <label
                      key={u.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 text-sm last:border-0 hover:bg-black/[0.02] dark:border-gray-700/60 dark:hover:bg-white/[0.03]"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(u.id)}
                        onChange={() => toggle(u.id)}
                        className="h-4 w-4"
                      />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{displayName(u)}</span>
                      <span className="ml-auto text-xs text-gray-500">{u.email}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selected.length === 0
                  ? "Select one or more members. Emails go to the address on each account."
                  : `Sending to: ${selectedUsers.map(displayName).join(", ") || `${selected.length} member(s)`}`}
              </p>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4"
            />
            Also send this as an email
          </label>
        </div>

        <Field label="Title *">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Scheduled maintenance this weekend" />
        </Field>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Message body *
            </span>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={useHtml}
                onChange={(e) => setUseHtml(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              HTML mode
            </label>
          </div>
          {useHtml ? (
            <textarea
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={`${inputCls} font-mono text-xs`}
              placeholder={`<p>Dear member,</p><p>Our new <strong>instant transfers</strong> are live.</p><ul><li>Faster settlements</li><li>No hidden fees</li></ul>`}
            />
          ) : (
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={inputCls}
              placeholder="We'll be upgrading our banking core on Saturday between 02:00–04:00 UTC."
            />
          )}
          {useHtml && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              HTML is sanitized on delivery — scripts and event handlers are stripped
              automatically; links, images, lists and formatting are preserved.
            </p>
          )}
        </div>

        <Field label="Link (optional)">
          <input value={link} onChange={(e) => setLink(e.target.value)} className={inputCls} placeholder="/dashboard" />
        </Field>

        {result && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {result}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setPreviewOpen(true)}
            disabled={!title.trim() || !body.trim()}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-800 ring-1 ring-gray-300 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-100 dark:ring-gray-600 dark:hover:bg-gray-700/60"
          >
            Preview
          </button>
          <button
            onClick={send}
            disabled={busy || !canSend}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--brand)" }}
          >
            {busy ? "Sending…" : "Send broadcast"}
          </button>
        </div>
      </div>

      {previewOpen && (
        <Modal title="Broadcast preview" onClose={() => setPreviewOpen(false)}>
          <p className="mb-3 text-xs uppercase tracking-wider text-gray-400">
            Audience: {audienceLabel}
          </p>
          <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700/60 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand)" }}>
                <i className="fa-solid fa-bullhorn" /> {`AllyBank · Announcement`}
              </span>
            </div>
            <div className="mt-2 font-semibold text-gray-900 dark:text-white">{title}</div>
            <SafeHtml html={body} className="prose-sm mt-2 max-w-none text-sm leading-relaxed text-gray-700 dark:text-gray-300 [&_a]:underline [&_img]:max-w-full [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" />
            {link && <div className="mt-2 text-xs text-[var(--brand)] underline">View details →</div>}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            This is exactly how the announcement renders in the notification feed, and the same
            HTML is used for the email when email delivery is enabled.
          </p>
        </Modal>
      )}
    </div>
  );
}

export default function AdminBroadcastPage() {
  return (
    <AdminShell>
      <BroadcastAdmin />
    </AdminShell>
  );
}

