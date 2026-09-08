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
}: AuthInputProps) {
  return (
    <label className="mb-4 block text-sm">
      <span className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        style={{ "--tw-ring-color": brand } as React.CSSProperties}
        className={cn(
          "w-full rounded-xl border bg-gray-50/50 px-3 py-3 text-sm text-gray-900 outline-none transition",
          "focus:ring-2 disabled:opacity-50 dark:bg-gray-700/50 dark:text-white",
          error
            ? "border-red-500/60"
            : "border-gray-300/50 dark:border-gray-600/50",
        )}
      />
      {error ? (
        <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span>
      ) : null}
    </label>
  );
}