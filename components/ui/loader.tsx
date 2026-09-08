import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  /** Icon size in pixels. */
  size?: number;
  label?: string;
  /** Render inline instead of a full-screen block. */
  inline?: boolean;
}

/** Spinner used for inline loads and the full-page loading state. */
export function Loader({ className, size = 24, label, inline = false }: LoaderProps) {
  const icon = (
    <LoaderCircle
      aria-hidden={!label}
      aria-label={label}
      className={cn("animate-spin text-current", className)}
      style={{ width: size, height: size }}
    />
  );

  if (inline) return icon;

  return (
    <div
      className="flex min-h-[calc(100dvh-3.5rem)] w-full items-center justify-center sm:min-h-[calc(100dvh-4rem)]"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        aria-label={label ?? "Loading"}
        className={cn("animate-spin text-gray-400 dark:text-gray-500", className)}
        style={{ width: size, height: size }}
      />
    </div>
  );
}