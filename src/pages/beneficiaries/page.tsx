"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/lib/next/link";
import { LoaderCircle, X } from "lucide-react";
import { AppShell, useMe } from "@/components/dashboard/app-shell";
import { bankFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Beneficiary {
  id: number | string;
  name: string;
  kind?: string;
  account_number?: string;
  bank_name?: string;
  swift?: string;
  account_type?: string;
  routing_number?: string;
  country?: string;
  bank_address?: string;
  iban?: string;
  crypto_currency?: string;
  favorite?: boolean;
  used_count?: number;
  last_used_at?: string;
}

interface BeneficiariesResponse {
  beneficiaries: Beneficiary[];
}

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  fullScreenOnMobile?: boolean;
}

const DIALOG_SIZES: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-6xl",
};

const BTN_VARIANTS: Record<string, string> = {
  primary:
    "btn-primary text-white",
  secondary:
    "btn-secondary border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
  danger:
    "btn-danger border border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-300",
  ghost: "btn-ghost",
};

const BTN_SIZES: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

const BTN_ICON_SIZES: Record<string, string> = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-4 w-4",
};

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BTN_VARIANTS;
  size?: keyof typeof BTN_SIZES;
  loading?: boolean;
  icon?: React.ReactNode;
}

function Btn({
  variant = "primary",
  size = "md",
  loading,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: BtnProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn("relative rounded-lg", BTN_VARIANTS[variant], BTN_SIZES[size], className)}
      style={variant === "primary" ? { background: "linear-gradient(135deg, var(--brand), rgba(0,0,0,0.25))" } : undefined}
      {...rest}
    >
      {loading && (
        <LoaderCircle
          className={cn("absolute inset-0 m-auto animate-spin", BTN_ICON_SIZES[size])}
          aria-hidden
        />
      )}
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {icon}
        {children}
      </span>
    </button>
  );
}

function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  fullScreenOnMobile = false,
}: DialogProps) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-[110] flex w-[95vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white shadow-xl outline-none animate-modal-in dark:bg-gray-900",
          "max-h-[85dvh] sm:max-h-[90dvh]",
          DIALOG_SIZES[size],
          fullScreenOnMobile &&
            "max-sm:left-0 max-sm:top-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-800">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children != null && (
          <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        )}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 p-4 dark:border-gray-800">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

function useConfirm() {
  const [state, setState] = useState<{ open: boolean; props: ConfirmOptions | null }>({
    open: false,
    props: null,
  });
  const [busy, setBusy] = useState(false);

  return {
    confirm: (props: ConfirmOptions) => {
      setBusy(false);
      setState({ open: true, props });
    },
    dialog: state.props ? (
      <Dialog
        open={state.open}
        onOpenChange={(open) => {
          if (!busy) setState((s) => ({ ...s, open }));
        }}
        title={state.props.title}
        description={state.props.description}
        size="sm"
        footer={
          <>
            <Btn
              variant="secondary"
              onClick={() => setState((s) => ({ ...s, open: false }))}
              disabled={busy}
            >
              Cancel
            </Btn>
            <Btn
              variant={state.props.variant === "danger" ? "danger" : "primary"}
              loading={busy}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await state.props?.onConfirm();
                  setState((s) => ({ ...s, open: false }));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {state.props.confirmLabel ?? "Confirm"}
            </Btn>
          </>
        }
      />
    ) : null,
  };
}

const FILTERS: { value: string; label: string; icon?: string }[] = [
  { value: "all", label: "All" },
  { value: "local", label: "Local" },
  { value: "international", label: "International" },
  { value: "favorites", label: "Favorites", icon: "fa-star" },
];

export default function BeneficiariesPage() {
  return (
    <AppShell>
      <BeneficiariesFlow />
    </AppShell>
  );
}

function BeneficiariesFlow() {
  const brand = useMe().site.brand_color || "#0ea5e9";

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [beneficiary, setBeneficiary] = useState<Beneficiary | "new" | null>(null);
  const [filter, setFilter] = useState("all");
  const { confirm, dialog } = useConfirm();

  async function load() {
    const res = await bankFetch<BeneficiariesResponse>("/beneficiaries");
    if (res.ok && res.data?.beneficiaries) {
      setBeneficiaries(res.data.beneficiaries);
    }
  }

  async function toggleFavorite(b: Beneficiary) {
    await bankFetch(`/beneficiaries/${b.id}`, {
      method: "PATCH",
      body: { favorite: !b.favorite },
    });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () =>
      filter === "all"
        ? beneficiaries
        : filter === "favorites"
          ? beneficiaries.filter((b) => b.favorite)
          : beneficiaries.filter((b) => (b.kind ?? "local") === filter),
    [beneficiaries, filter],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Save recipients so you can send money faster next time.
        </p>
        <button
          type="button"
          onClick={() => setBeneficiary("new")}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
          style={{ background: `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.25))` }}
        >
          <i className="fa-solid fa-plus text-sm" /> Add beneficiary
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${active ? "border-transparent text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`}
              style={active ? { background: brand } : undefined}
            >
              {item.icon && <i className={`fa-solid ${item.icon} mr-1.5`} />}
              {item.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-gray-200/70 bg-white p-10 text-center shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
          <div
            className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-white"
            style={{ background: brand }}
          >
            <i className="fa-solid fa-users text-xl" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No beneficiaries found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filter === "all"
              ? "Add one to speed up your next transfer."
              : "Try a different filter or add a new beneficiary."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {visible.map((item) => {
            const kind = item.kind ?? "local";
            const to = item.account_number ?? "";
            return (
              <div
                key={item.id}
                className="flex flex-col rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm dark:border-gray-700/50 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(item)}
                        className={`transition ${item.favorite ? "text-amber-500" : "text-gray-300 hover:text-amber-400 dark:text-gray-600"}`}
                        title={item.favorite ? "Unfavorite" : "Favorite"}
                      >
                        <i className="fa-solid fa-star text-sm" />
                      </button>
                      <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                        {item.name}
                      </h3>
                    </div>
                    <div className="mb-1 inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      {kind} transfer
                    </div>
                    {kind === "crypto" ? (
                      <>
                        {item.crypto_currency && (
                          <div className="text-xs text-gray-500">
                            {item.crypto_currency}
                          </div>
                        )}
                        {item.account_number && (
                          <div className="truncate font-mono text-xs text-gray-600 dark:text-gray-400">
                            {item.account_number}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {item.account_number && (
                          <div className="truncate text-xs text-gray-600 dark:text-gray-400">
                            {item.account_number}
                          </div>
                        )}
                        {item.bank_name && (
                          <div className="text-xs text-gray-500">{item.bank_name}</div>
                        )}
                        {item.iban && (
                          <div className="truncate font-mono text-xs text-gray-500">
                            IBAN: {item.iban}
                          </div>
                        )}
                        {item.swift && (
                          <div className="font-mono text-xs text-gray-500">
                            SWIFT: {item.swift}
                          </div>
                        )}
                        {item.country && (
                          <div className="text-xs text-gray-500">{item.country}</div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBeneficiary(item)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <i className="fa-solid fa-pencil text-xs" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const id = item.id;
                        void confirm({
                          title: "Delete beneficiary",
                          description: "Delete this beneficiary?",
                          confirmLabel: "Delete",
                          variant: "danger",
                          onConfirm: async () => {
                            await bankFetch(`/beneficiaries/${id}`, {
                              method: "DELETE",
                            });
                            load();
                          },
                        });
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-700 transition hover:bg-red-500/20 dark:text-red-300"
                    >
                      <i className="fa-solid fa-trash text-xs" /> Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Used {item.used_count ?? 0} times</span>
                  <span>
                    {item.last_used_at
                      ? `Last used ${new Date(item.last_used_at).toLocaleDateString()}`
                      : "Never used"}
                  </span>
                </div>
                <Link
                  href={to ? `/transfer?to=${encodeURIComponent(to)}` : "/transfer"}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01]"
                  style={{ background: `linear-gradient(135deg, ${brand}, rgba(0,0,0,0.25))` }}
                >
                  <i className="fa-solid fa-paper-plane text-xs" /> Transfer
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <BeneficiaryModal
        beneficiary={beneficiary}
        brand={brand}
        onClose={() => setBeneficiary(null)}
        onSaved={() => {
          setBeneficiary(null);
          load();
        }}
      />
      {dialog}
    </div>
  );
}

function BeneficiaryModal({
  beneficiary,
  brand,
  onClose,
  onSaved,
}: {
  beneficiary: Beneficiary | "new" | null;
  brand: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState("local");
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [swift, setSwift] = useState("");
  const [accountType, setAccountType] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [country, setCountry] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [iban, setIban] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState("BTC");
  const [favorite, setFavorite] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (beneficiary && beneficiary !== "new") {
      setKind(beneficiary.kind ?? "local");
      setName(beneficiary.name);
      setAccountNumber(beneficiary.account_number ?? "");
      setBankName(beneficiary.bank_name ?? "");
      setSwift(beneficiary.swift ?? "");
      setAccountType(beneficiary.account_type ?? "");
      setRoutingNumber(beneficiary.routing_number ?? "");
      setCountry(beneficiary.country ?? "");
      setBankAddress(beneficiary.bank_address ?? "");
      setIban(beneficiary.iban ?? "");
      setCryptoCurrency(beneficiary.crypto_currency ?? "BTC");
      setFavorite(beneficiary.favorite ?? false);
    } else {
      setKind("local");
      setName("");
      setAccountNumber("");
      setBankName("");
      setSwift("");
      setAccountType("");
      setRoutingNumber("");
      setCountry("");
      setBankAddress("");
      setIban("");
      setCryptoCurrency("BTC");
      setFavorite(false);
    }
  }, [beneficiary]);

  if (!beneficiary) return null;

  const current = beneficiary;
  const isNew = current === "new";

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const body: Record<string, unknown> = { name: name.trim(), kind, favorite };
    if (kind === "crypto") {
      if (accountNumber.trim()) body.account_number = accountNumber.trim();
      if (cryptoCurrency.trim()) body.crypto_currency = cryptoCurrency.trim();
    } else {
      if (accountNumber.trim()) body.account_number = accountNumber.trim();
      if (bankName.trim()) body.bank_name = bankName.trim();
      if (swift.trim()) body.swift = swift.trim();
      if (accountType.trim()) body.account_type = accountType.trim();
      if (routingNumber.trim()) body.routing_number = routingNumber.trim();
      if (kind === "international") {
        if (country.trim()) body.country = country.trim();
        if (bankAddress.trim()) body.bank_address = bankAddress.trim();
        if (iban.trim()) body.iban = iban.trim();
      }
    }
    if (isNew) {
      await bankFetch("/beneficiaries", { method: "POST", body });
    } else {
      await bankFetch(`/beneficiaries/${current.id}`, {
        method: "PATCH",
        body,
      });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200/70 bg-white p-6 shadow-2xl dark:border-gray-700/50 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          {isNew ? "Add beneficiary" : "Edit beneficiary"}
        </h2>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {["local", "international", "crypto"].map((value) => {
              const active = kind === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKind(value)}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold capitalize transition ${active ? "border-transparent text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"}`}
                  style={active ? { background: brand } : undefined}
                >
                  {value}
                </button>
              );
            })}
          </div>

          <Field label="Name" value={name} onChange={setName} />

          {kind === "crypto" ? (
            <>
              <SelectField
                label="Cryptocurrency"
                value={cryptoCurrency}
                onChange={setCryptoCurrency}
                options={[
                  ["BTC", "Bitcoin (BTC)"],
                  ["ETH", "Ethereum (ETH)"],
                  ["USDT", "Tether (USDT)"],
                  ["LTC", "Litecoin (LTC)"],
                ]}
              />
              <Field
                label="Wallet address"
                value={accountNumber}
                onChange={setAccountNumber}
                placeholder="Recipient wallet address"
                mono
              />
            </>
          ) : (
            <>
              <Field
                label="Account / email"
                value={accountNumber}
                onChange={setAccountNumber}
                placeholder="them@example.com or 1234567890"
              />
              <Field label="Bank name" value={bankName} onChange={setBankName} />
              <SelectField
                label="Account type"
                value={accountType}
                onChange={setAccountType}
                options={[
                  ["", "Select…"],
                  ["Online Banking", "Online Banking"],
                  ["Savings Account", "Savings Account"],
                  ["Checking Account", "Checking Account"],
                  ["Business Account", "Business Account"],
                ]}
              />
              <Field
                label="Routing number (optional)"
                value={routingNumber}
                onChange={setRoutingNumber}
                placeholder="9-digit routing number"
              />
              <Field label="SWIFT / BIC (optional)" value={swift} onChange={setSwift} />
              {kind === "international" && (
                <>
                  <Field label="Country" value={country} onChange={setCountry} />
                  <Field
                    label="Bank address"
                    value={bankAddress}
                    onChange={setBankAddress}
                  />
                  <Field
                    label="IBAN (optional)"
                    value={iban}
                    onChange={setIban}
                    mono
                  />
                </>
              )}
            </>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
            />
            Mark as favorite
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !name.trim()}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
            style={{ background: brand }}
          >
            {isNew ? "Add" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      >
        {options.map(([optionValue, optionText]) => (
          <option key={optionValue} value={optionValue}>
            {optionText}
          </option>
        ))}
      </select>
    </label>
  );
}