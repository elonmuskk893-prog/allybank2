import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  /** Show a spinner and disable the button while a request is in flight. */
  loading?: boolean;
  disabled?: boolean;
  brand?: string;
  children: React.ReactNode;
}

/** Full-width gradient submit button used on auth forms. */
export function SubmitButton({
  loading,
  disabled,
  brand = "#0ea5e9",
  children,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3",
        "text-sm font-semibold text-white shadow-lg transition",
        "hover:scale-[1.02] disabled:opacity-60",
      )}
      style={{
        background: `linear-gradient(to right, ${brand}, rgba(0,0,0,0.25))`,
      }}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}