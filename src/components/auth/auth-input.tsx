import { useState } from "react";
import { cn } from "@/lib/utils";

interface AuthInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
  brand?: string;
  /** Shows an eye button to toggle password visibility. */
  revealable?: boolean;
}

/** Labeled text input used across the auth forms. */
export function AuthInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  disabled,
  error,
  brand = "#0ea5e9",
  revealable = false,
}: AuthInputProps) {
  const [revealed, setRevealed] = useState(false);
  const effectiveType = revealable ? (revealed ? "text" : "password") : type;

  return (
    <label className="mb-4 block text-sm">
      <span className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <div className="relative">
        <input
          type={effectiveType}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          style={{ "--tw-ring-color": brand } as React.CSSProperties}
          className={cn(
            "w-full rounded-xl border bg-gray-50/50 px-3 py-3 text-sm text-gray-900 outline-none transition",
            "focus:ring-2 disabled:opacity-50 dark:bg-gray-700/50 dark:text-white",
            revealable && "pr-10",
            error
              ? "border-red-500/60"
              : "border-gray-300/50 dark:border-gray-600/50",
          )}
        />
        {revealable ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={revealed ? "Hide password" : "Show password"}
            onClick={() => setRevealed((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <i className={`fas ${revealed ? "fa-eye-slash" : "fa-eye"} text-sm`} />
          </button>
        ) : null}
      </div>
      {error ? (
        <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span>
      ) : null}
    </label>
  );
}
