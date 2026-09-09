"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { bankFetch } from "@/lib/api";
import type { SessionUser } from "@/lib/types";

const TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr"];
const GENDERS = ["Male", "Female", "Other"];
const ACCOUNT_TYPES = [
  "Checking Account",
  "Savings Account",
  "Fixed Deposit Account",
  "Current Account",
  "Crypto Currency Account",
  "Business Account",
  "Investment Account",
];

const DOC_TYPES = [
  { value: "passport", label: "Passport", icon: "fa-solid fa-book" },
  { value: "national_id", label: "National ID", icon: "fa-solid fa-flag" },
  { value: "driver", label: "Driver's licence", icon: "fa-solid fa-id-card" },
];

interface UserProfile extends SessionUser {
  title?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
}

interface KycRecord {
  title?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  ssn?: string;
  account_type?: string;
  employer?: string;
  income?: string;
  nok_name?: string;
  nok_relationship?: string;
  nok_phone?: string;
  nok_address?: string;
  doc_type?: string;
  doc_url?: string;
  doc_back_url?: string;
  selfie_url?: string;
  admin_note?: string;
}

interface KycResponse {
  kyc: KycRecord;
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

function putFile(url: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.min(99, Math.round((event.loaded / event.total) * 100)));
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

interface UploadResponse {
  url: string;
  publicUrl: string;
}

async function upload(file: File, onProgress?: (pct: number) => void): Promise<string | null> {
  const res = await bankFetch<UploadResponse>("/upload", {
    method: "POST",
    body: {
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    },
  });
  if (!res.ok || !res.data) return null;
  try {
    await putFile(res.data.url, file, onProgress);
  } catch {
    return null;
  }
  return res.data.publicUrl;
}

export default function KycPage() {
  return (
    <AppShell>
      <KycFlow />
    </AppShell>
  );
}

function KycFlow() {
  const { site, user } = useMe();
  const profile = user as UserProfile;
  const brand = site.brand_color || "#0ea5e9";

  const [title, setTitle] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [ssn, setSsn] = useState("");
  const [accountType, setAccountType] = useState("");
  const [employer, setEmployer] = useState("");
  const [income, setIncome] = useState("");
  const [nokName, setNokName] = useState("");
  const [nokRelationship, setNokRelationship] = useState("");
  const [nokPhone, setNokPhone] = useState("");
  const [nokAddress, setNokAddress] = useState("");
  const [docType, setDocType] = useState("passport");
  const [docUrl, setDocUrl] = useState("");
  const [docBackUrl, setDocBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [prior, setPrior] = useState<KycRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    setTitle(profile.title ?? "");
    setGender(profile.gender ?? "");
    setDob((profile.dob ?? "").slice(0, 10));
    setPhone(profile.phone ?? "");
    setAddress(profile.address ?? "");
    setCity(profile.city ?? "");
    setState(profile.state ?? "");
    setCountry(profile.country ?? "");
    setZipcode(profile.zipcode ?? "");
    (async () => {
      const res = await bankFetch<KycResponse>("/me/kyc");
      if (res.ok && res.data?.kyc) {
        const kyc = res.data.kyc;
        setPrior(kyc);
        if (kyc.title) setTitle(kyc.title);
        if (kyc.gender) setGender(kyc.gender);
        if (kyc.dob) setDob(String(kyc.dob).slice(0, 10));
        if (kyc.phone) setPhone(kyc.phone);
        if (kyc.address) setAddress(kyc.address);
        if (kyc.city) setCity(kyc.city);
        if (kyc.state) setState(kyc.state);
        if (kyc.country) setCountry(kyc.country);
        if (kyc.zipcode) setZipcode(kyc.zipcode);
        if (kyc.ssn) setSsn(kyc.ssn);
        if (kyc.account_type) setAccountType(kyc.account_type);
        if (kyc.employer) setEmployer(kyc.employer);
        if (kyc.income) setIncome(kyc.income);
        if (kyc.nok_name) setNokName(kyc.nok_name);
        if (kyc.nok_relationship) setNokRelationship(kyc.nok_relationship);
        if (kyc.nok_phone) setNokPhone(kyc.nok_phone);
        if (kyc.nok_address) setNokAddress(kyc.nok_address);
        if (kyc.doc_type) setDocType(kyc.doc_type);
        if (kyc.doc_url) setDocUrl(kyc.doc_url);
        if (kyc.doc_back_url) setDocBackUrl(kyc.doc_back_url);
        if (kyc.selfie_url) setSelfieUrl(kyc.selfie_url);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kycStatus = user.kyc_status;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    setSubmitting(true);
    const trim = (value: string) => value.trim();
    const res = await bankFetch("/kyc", {
      method: "POST",
      body: {
        doc_type: docType,
        ...(docUrl ? { doc_url: docUrl } : {}),
        ...(docBackUrl ? { doc_back_url: docBackUrl } : {}),
        ...(selfieUrl ? { selfie_url: selfieUrl } : {}),
        title: trim(title),
        gender: trim(gender),
        dob: trim(dob),
        phone: trim(phone),
        address: trim(address),
        city: trim(city),
        state: trim(state),
        country: trim(country),
        zipcode: trim(zipcode),
        ssn: trim(ssn),
        account_type: trim(accountType),
        employer: trim(employer),
        income: trim(income),
        nok_name: trim(nokName),
        nok_relationship: trim(nokRelationship),
        nok_phone: trim(nokPhone),
        nok_address: trim(nokAddress),
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error ?? "Failed");
      return;
    }
    setResult({ kind: "ok", text: "Submitted for review." });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-xl dark:border-gray-700/50 dark:bg-gray-800">
        <div
          className="relative overflow-hidden p-6 text-center text-white"
          style={{ background: `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.35))` }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
              <i className="fa-solid fa-clipboard-check text-2xl" />
            </div>
            <h2 className="text-2xl font-bold">Verify your identity</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-white/90">
              A few details and a photo of your ID help us confirm it&apos;s
              really you and keep your account safe.
            </p>
          </div>
        </div>
      </div>

      <StatusBanner status={kycStatus} prior={prior} />

      {"pending" === kycStatus && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
          <i className="fa-solid fa-clock mt-0.5 shrink-0" />
          <span>
            Your previous application is under review -- please wait. You can
            update and resend it below if anything changed.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard
          icon="fa-solid fa-user"
          title="Personal details"
          subtitle="Your personal information, used to confirm who you are."
          brand={brand}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label="Title"
              value={title}
              onChange={setTitle}
              disabled={submitting}
              options={TITLES}
              placeholder="Select your title"
              required
            />
            <SelectField
              label="Gender"
              value={gender}
              onChange={setGender}
              disabled={submitting}
              options={GENDERS}
              placeholder="Select your gender"
              required
            />
            <DateField
              label="Date of birth"
              value={dob}
              onChange={setDob}
              disabled={submitting}
              required
            />
            <TextField
              label="Phone"
              value={phone}
              onChange={setPhone}
              disabled={submitting}
              placeholder="+1 555 000 0000"
              required
            />
            <TextField
              label="Address"
              value={address}
              onChange={setAddress}
              disabled={submitting}
              placeholder="Street address"
              required
            />
            <TextField
              label="City"
              value={city}
              onChange={setCity}
              disabled={submitting}
              required
            />
            <TextField
              label="State / Province"
              value={state}
              onChange={setState}
              disabled={submitting}
              required
            />
            <TextField
              label="Country"
              value={country}
              onChange={setCountry}
              disabled={submitting}
              required
            />
            <TextField
              label="Zip / Postal code"
              value={zipcode}
              onChange={setZipcode}
              disabled={submitting}
              required
            />
          </div>
        </SectionCard>

        <SectionCard
          icon="fa-solid fa-briefcase"
          title="Employment & identity"
          subtitle="Helps us verify you and is required for some banking services."
          brand={brand}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="SSN / National ID number"
              value={ssn}
              onChange={setSsn}
              disabled={submitting}
            />
            <SelectField
              label="Account type"
              value={accountType}
              onChange={setAccountType}
              disabled={submitting}
              options={ACCOUNT_TYPES}
              placeholder="Select account type"
            />
            <TextField
              label="Employer / occupation"
              value={employer}
              onChange={setEmployer}
              disabled={submitting}
              placeholder="Where you work"
            />
            <TextField
              label="Annual income"
              value={income}
              onChange={setIncome}
              disabled={submitting}
              placeholder="e.g. $30,000 - $70,000"
            />
          </div>
        </SectionCard>

        <SectionCard
          icon="fa-solid fa-users"
          title="Next of kin"
          subtitle="Someone we can contact about your account if needed."
          brand={brand}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Full name"
              value={nokName}
              onChange={setNokName}
              disabled={submitting}
            />
            <TextField
              label="Relationship"
              value={nokRelationship}
              onChange={setNokRelationship}
              disabled={submitting}
              placeholder="e.g. Spouse, Parent"
            />
            <TextField
              label="Phone"
              value={nokPhone}
              onChange={setNokPhone}
              disabled={submitting}
              placeholder="+1 555 000 0000"
            />
            <TextField
              label="Address"
              value={nokAddress}
              onChange={setNokAddress}
              disabled={submitting}
              placeholder="Street address"
            />
          </div>
        </SectionCard>

        <SectionCard
          icon="fa-solid fa-file-lines"
          title="Documents"
          subtitle="A clear photo of your ID, plus a selfie to match it."
          brand={brand}
        >
          <p className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
            {"Document type "}
            <span className="text-red-500">*</span>
          </p>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DOC_TYPES.map((item) => {
              const selected = docType === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDocType(item.value)}
                  disabled={submitting}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition hover:shadow-md ${selected ? "border-transparent ring-2" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40"}`}
                  style={
                    selected
                      ? ({
                          "--tw-ring-color": brand,
                          background: `color-mix(in srgb, ${brand} 8%, transparent)`,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  <i className={`${item.icon} text-lg`} style={{ color: brand }} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mb-5 rounded-xl border border-gray-200/60 bg-gray-50 p-4 dark:border-gray-700/50 dark:bg-gray-900/40">
            <p className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
              <i className="fa-solid fa-circle-exclamation" style={{ color: brand }} />
              {" To avoid delays"}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-check-circle mt-0.5" style={{ color: brand }} />
                {" Make sure the document hasn't expired"}
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-check-circle mt-0.5" style={{ color: brand }} />
                {" Keep it in good condition and clearly visible"}
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-check-circle mt-0.5" style={{ color: brand }} />
                {" Avoid glare or shadows on the photo"}
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <UploadField
              label="Front of document"
              value={docUrl}
              onChange={setDocUrl}
              upload={upload}
              brand={brand}
              disabled={submitting}
              hint="A clear photo of the front of your passport, licence, or national ID."
            />
            {"passport" !== docType && (
              <UploadField
                label="Back of document"
                value={docBackUrl}
                onChange={setDocBackUrl}
                upload={upload}
                brand={brand}
                disabled={submitting}
                hint="A clear photo of the back side of your ID or licence."
              />
            )}
            {"passport" === docType && (
              <UploadField
                label="Back of document (optional)"
                value={docBackUrl}
                onChange={setDocBackUrl}
                upload={upload}
                brand={brand}
                disabled={submitting}
                hint="If your passport has a back page with additional info, you may upload it here."
              />
            )}
            <UploadField
              label="Selfie"
              value={selfieUrl}
              onChange={setSelfieUrl}
              upload={upload}
              brand={brand}
              disabled={submitting}
              hint="A selfie holding your document helps us confirm it's you."
            />
          </div>
        </SectionCard>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={submitting}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-[--brand-color]"
            style={{ accentColor: brand }}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {"I confirm that all the information I have provided is accurate and complete, and I accept the "}
            <span className="font-medium" style={{ color: brand }}>
              {"Verification Terms & Conditions"}
            </span>
            {"."}
          </span>
        </label>

        {result && (
          <p
            className={`text-sm ${"ok" === result.kind ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {result.text}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !agreed}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01] disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.25))` }}
        >
          {submitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </form>

      <div className="flex items-start gap-3 rounded-xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
        <i className="fa-solid fa-shield-halved mt-0.5 shrink-0 text-base" style={{ color: brand }} />
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Your documents stay private
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            We use your ID only to verify your account. It&apos;s never shared
            with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBanner({
  status,
  prior,
}: {
  status: string;
  prior: KycRecord | null;
}) {
  if ("verified" === status) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300">
        <i className="fa-solid fa-circle-check" />
        {" Your identity is verified. You're all set."}
      </div>
    );
  }
  if ("rejected" === status && prior?.admin_note) {
    return (
      <div className="rounded-xl border border-red-200/60 bg-red-50 p-4 text-sm text-red-800 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300">
        <p className="flex items-center gap-2 font-semibold">
          <i className="fa-solid fa-circle-xmark" />
          {" Your last submission needs another look"}
        </p>
        <p className="mt-1 italic">“{prior.admin_note}”</p>
        <p className="mt-1">Please correct the details below and resubmit.</p>
      </div>
    );
  }
  return null;
}

function SectionCard({
  icon,
  title,
  subtitle,
  brand,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  brand: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
      <div className="flex items-center gap-3 border-b border-gray-200/50 px-5 py-4 dark:border-gray-700/50">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white"
          style={{ background: brand }}
        >
          <i className={`${icon} text-sm`} />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
      {text}
      {required && <span className="text-red-500"> *</span>}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel text={label} required={required} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={INPUT_CLASS}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  disabled,
  options,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  const extra = value && !options.includes(value) ? [value] : [];
  return (
    <label className="block">
      <FieldLabel text={label} required={required} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={INPUT_CLASS}
      >
        <option value="">{placeholder ?? "Select"}</option>
        {[...options, ...extra].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
  disabled,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel text={label} required={required} />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={INPUT_CLASS}
      />
    </label>
  );
}

function UploadField({
  value,
  onChange,
  upload,
  label,
  hint,
  brand,
  rounded,
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
  const brandColor = brand ?? "#0ea5e9";

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
            style={{ background: brandColor }}
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
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
