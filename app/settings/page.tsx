"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { bankFetch } from "@/lib/api";
import type { SessionUser } from "@/lib/types";

interface SessionUserExtra extends SessionUser {
  two_fa_enabled?: boolean;
}

interface Profile {
  first_name?: string;
  last_name?: string;
  email?: string;
  photo_url?: string;
  dob?: string;
  phone?: string;
  address?: string;
}

interface MeResponse {
  user: Profile;
}

interface Result {
  kind: "ok";
  text: string;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 bytes";
  if (bytes < 1024) return `${Math.round(bytes)} bytes`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let idx = 0;
  for (; size >= 1024 && idx < units.length - 1; ) {
    size /= 1024;
    idx++;
  }
  const text = Number.isInteger(size) ? String(size) : size.toFixed(1);
  return `${text} ${units[idx]}`;
}

function formatSizeError(size: number, limit: number, kind = "file"): string {
  return `That ${kind} is ${formatBytes(size)} — the limit is ${formatBytes(limit)}. Please compress it or upload a smaller one.`;
}

function putFile(
  url: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/banking-public/upload", true);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        try {
          const json = JSON.parse(xhr.responseText) as { data?: { publicUrl?: string } };
          resolve(json.data?.publicUrl ?? null);
        } catch {
          resolve(null);
        }
      } else {
        reject(new Error(`upload_failed_${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("upload_blocked"));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

async function upload(file: File, onProgress?: (pct: number) => void): Promise<string | null> {
  try {
    return await putFile("", file, onProgress);
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsFlow />
    </AppShell>
  );
}

function SettingsFlow() {
  const me = useMe();
  const user = me.user as SessionUserExtra;
  const accountNumber = user.account_number ?? String(user.id).padStart(10, "0");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  async function load() {
    const res = await bankFetch<MeResponse>("/me");
    if (res.ok && res.data?.user) setProfile(res.data.user);
  }

  useEffect(() => {
    load();
  }, []);

  const first = profile?.first_name ?? user.first_name ?? "";
  const last = profile?.last_name ?? user.last_name ?? "";
  const email = profile?.email ?? user.email;
  const photoUrl = profile?.photo_url ?? null;

  return (
    <div className="-mx-4 -my-5 min-h-screen space-y-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 lg:-mx-6 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="hidden rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/80 lg:block">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Account Settings
              </h1>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Manage your profile and security settings
              </p>
            </div>
            <div
              className="grid h-8 w-8 place-items-center rounded-xl text-white"
              style={{ background: "var(--brand)" }}
            >
              <i className="fa-solid fa-user text-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-lg backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <div
                className="relative p-4 text-white"
                style={{ background: "linear-gradient(135deg, var(--brand), rgba(0,0,0,0.35))" }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-white/50 bg-white shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element -- external avatar URL, parity requires plain img */}
                      <img
                        src={
                          photoUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(`${first} ${last}`)}&background=random`
                        }
                        alt={first}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoOpen(true)}
                      className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-xl bg-white shadow-md transition hover:bg-gray-100"
                    >
                      <i
                        className="fa-solid fa-camera text-xs"
                        style={{ color: "var(--brand)" }}
                      />
                    </button>
                  </div>
                  <h2 className="text-sm font-bold text-white">
                    {first} {last}
                  </h2>
                  <p className="text-xs text-white/80">Account #{accountNumber}</p>
                </div>
              </div>
              <div className="p-3">
                <nav className="space-y-1">
                  <Link
                    href="/settings"
                    className="flex items-center rounded-xl px-3 py-2 text-xs font-medium"
                    style={{
                      background: "color-mix(in srgb, var(--brand) 12%, transparent)",
                      color: "var(--brand)",
                    }}
                  >
                    <i className="fa-solid fa-user mr-2 text-xs" />
                    <span>Profile Information</span>
                  </Link>
                  <Link
                    href="/settings/security"
                    className="flex items-center rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                  >
                    <i className="fa-solid fa-key mr-2 text-xs" />
                    <span>Password Settings</span>
                  </Link>
                  <Link
                    href="/settings/security"
                    className="flex items-center rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                  >
                    <i className="fa-solid fa-shield mr-2 text-xs" />
                    <span>Two-Factor Authentication</span>
                    {user.two_fa_enabled && (
                      <span className="ml-auto inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <i className="fa-solid fa-check mr-0.5 text-xs" />
                        On
                      </span>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPinOpen(true)}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                  >
                    <i className="fa-solid fa-credit-card mr-2 text-xs" />
                    <span>Transaction PIN</span>
                  </button>
                  <Link
                    href="/settings/kyc"
                    className="flex items-center rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                  >
                    <i className="fa-solid fa-id-card mr-2 text-xs" />
                    <span>Verify Identity</span>
                    <KycBadge status={user.kyc_status} />
                  </Link>
                </nav>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <div className="mb-3 flex items-center justify-center">
                <div
                  className="grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg"
                  style={{ background: "var(--brand)" }}
                >
                  <i className="fa-solid fa-headset text-sm" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-white">
                  Need Assistance?
                </h3>
                <p className="mb-3 text-xs text-gray-700 dark:text-gray-300">
                  Our expert support team is available 24/7
                </p>
                <Link
                  href="/support"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:scale-105"
                  style={{ background: "var(--brand)" }}
                >
                  <i className="fa-solid fa-comments mr-2 text-xs" />
                  Start Live Chat
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-lg backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <div className="border-b border-gray-200/50 px-4 py-3 dark:border-gray-700/50">
                <div className="flex items-center">
                  <div
                    className="mr-2 grid h-6 w-6 place-items-center rounded-lg text-white"
                    style={{ background: "var(--brand)" }}
                  >
                    <i className="fa-solid fa-user text-xs" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                      Profile Information
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Your personal information and account details
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoField label="First Name" icon="fa-user" value={first} />
                  <InfoField label="Last Name" icon="fa-user" value={last} />
                </div>
                <InfoField
                  label="Account Number"
                  icon="fa-hashtag"
                  value={accountNumber}
                  copy
                  hint="Your unique account identifier"
                />
                <InfoField label="Email Address" icon="fa-envelope" value={email} />
                <InfoField
                  label="Date of Birth"
                  icon="fa-calendar"
                  value={profile?.dob ?? ""}
                />
                <InfoField
                  label="Phone Number"
                  icon="fa-phone"
                  value={profile?.phone ?? ""}
                />
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-2">
                      <i className="fa-solid fa-map-pin text-xs text-gray-400" />
                    </span>
                    <textarea
                      rows={2}
                      readOnly
                      value={profile?.address ?? ""}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 text-xs text-gray-700 outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300 resize-none"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-800/50 dark:bg-blue-900/20">
                  <div className="flex">
                    <i className="fa-solid fa-info-circle text-sm text-blue-500" />
                    <div className="ml-2">
                      <h3 className="text-xs font-medium text-blue-800 dark:text-blue-300">
                        Account Information
                      </h3>
                      <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                        To update your personal information, please contact our customer
                        support team.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {photoOpen && (
        <PhotoModal
          current={photoUrl}
          onClose={() => setPhotoOpen(false)}
          onSaved={() => {
            setPhotoOpen(false);
            load();
          }}
        />
      )}
      {pinOpen && <PinModal onClose={() => setPinOpen(false)} />}
    </div>
  );
}

function KycBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; cls: string }> = {
    verified: {
      text: "Verified",
      cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    pending: {
      text: "In review",
      cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    rejected: {
      text: "Rejected",
      cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
  };
  const badge = config[status] ?? {
    text: "Unverified",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span
      className={`ml-auto inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${badge.cls}`}
    >
      {badge.text}
    </span>
  );
}

function InfoField({
  label,
  icon,
  value,
  copy,
  hint,
}: {
  label: string;
  icon: string;
  value: string;
  copy?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <i className={`fa-solid ${icon} text-xs text-gray-400`} />
        </span>
        <input
          readOnly
          value={value}
          className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-8 text-xs text-gray-700 outline-none dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300"
        />
        {copy && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(value)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:opacity-70"
          >
            <i className="fa-solid fa-copy text-xs" />
          </button>
        )}
      </div>
      {hint && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

function PhotoModal({
  current,
  onClose,
  onSaved,
}: {
  current: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [photo, setPhoto] = useState(current ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await bankFetch("/me", {
      method: "PATCH",
      body: { photo_url: photo.trim() || null },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Failed");
      return;
    }
    onSaved();
  }

  return (
    <Modal title="Update Profile Picture" onClose={onClose}>
      <div className="space-y-3">
        <AvatarUpload
          label="Profile picture"
          value={photo}
          onChange={setPhoto}
          upload={upload}
          rounded
          hint="PNG or JPG."
        />
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full rounded-xl px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ background: "var(--brand)" }}
        >
          <i className="fa-solid fa-upload mr-1 text-xs" />{" "}
          {saving ? "Saving…" : "Update Profile Picture"}
        </button>
      </div>
    </Modal>
  );
}

function PinModal({ onClose }: { onClose: () => void }) {
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function save() {
    if (pin.length < 4) {
      toast.error("PIN must be 4-6 digits.");
      return;
    }
    setSaving(true);
    setResult(null);
    const res = await bankFetch("/me/pin", {
      method: "POST",
      body: { current_password: password, pin },
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(
        res.errorCode === "bad_password"
          ? "Your current password is wrong."
          : res.errorCode === "unauthenticated"
            ? "Your session expired -- please sign in again."
            : res.errorCode === "invalid_input"
              ? "PIN must be 4-6 digits."
              : (res.error ?? "Could not update your PIN. Please try again."),
      );
      return;
    }
    setResult({ kind: "ok", text: "Transaction PIN updated." });
  }

  return (
    <Modal title="Change Transaction PIN" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            New Transaction PIN
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <i className="fa-solid fa-key text-xs text-gray-400" />
            </span>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter new transaction PIN"
              className="block w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 text-xs text-gray-700 outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Create a secure PIN you can remember
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Current Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <i className="fa-solid fa-lock text-xs text-gray-400" />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your current password"
              className="block w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 text-xs text-gray-700 outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            For security verification
          </p>
        </div>

        <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-3 dark:border-yellow-800/50 dark:bg-yellow-900/20">
          <div className="flex">
            <i className="fa-solid fa-exclamation-triangle text-sm text-yellow-500" />
            <div className="ml-2">
              <h3 className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                Security Alert
              </h3>
              <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                Keep your transaction PIN confidential. Never share it with anyone.
              </p>
            </div>
          </div>
        </div>

        {result && (
          <p
            className={`text-xs ${"ok" === result.kind ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {result.text}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full rounded-xl px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ background: "var(--brand)" }}
        >
          <i className="fa-solid fa-rotate-right mr-1 text-xs" />{" "}
          {saving ? "Updating…" : "Update Transaction PIN"}
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <i className="fa-solid fa-times text-sm" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function AvatarUpload({
  value,
  onChange,
  upload,
  label,
  hint,
  brand = "#0ea5e9",
  rounded = false,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  upload: (file: File) => Promise<string | null>;
  label?: string;
  hint?: string;
  brand?: string;
  rounded?: boolean;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 8388608) {
      setError(formatSizeError(file.size, 8388608, "image"));
      return;
    }
    setError(null);
    setUploading(true);
    const url = await upload(file);
    setUploading(false);
    if (!url) {
      setError("Upload failed -- please try again.");
      return;
    }
    onChange(url);
  }

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <div
          className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 ${rounded ? "rounded-full" : "rounded-xl"}`}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <i className="fa-solid fa-image text-gray-400" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={uploading || disabled}
            onClick={() => ref.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            style={{ background: brand }}
          >
            {uploading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <i className="fa-solid fa-arrow-up-from-bracket text-xs" />
            )}
            {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-left text-xs font-medium text-red-600 hover:opacity-80 dark:text-red-400"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {hint && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}