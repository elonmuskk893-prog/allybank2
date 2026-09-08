"use client";

import { useState } from "react";
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

function BroadcastAdmin() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [segment, setSegment] = useState("all");
  const [useHtml, setUseHtml] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const send = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await adminFetch<{ recipients: number; segment: string }>(
      "teslamodel",
      "/broadcast",
      {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          link,
          segment,
        }),
      },
    );
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? "Broadcast failed.");
      return;
    }
    const segLabel =
      SEGMENTS.find((s) => s.value === res.data!.segment)?.label ?? res.data.segment;
    setResult(`Delivered to ${res.data.recipients} member${res.data.recipients === 1 ? "" : "s"} (${segLabel}).`);
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
        <Field label="Audience segment">
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className={inputCls}
          >
            {SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

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
            disabled={busy || !title.trim() || !body.trim()}
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
            Audience: {SEGMENTS.find((s) => s.value === segment)?.label}
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
            This is exactly how the notification will render for each recipient in the selected segment.
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

