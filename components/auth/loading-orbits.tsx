import { cn } from "@/lib/utils";

interface LoadingOrbitsProps {
  /** Brand color used for the orbit rings and core. */
  brand?: string;
  /** Override the default size of the loader. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-16 w-16",
  md: "h-28 w-28",
  lg: "h-28 w-28",
} as const;

/**
 * Animated concentric orbit loader used on auth pages and the full-screen
 * "Loading" overlay. Matches the original site's brand loader.
 */
export function LoadingOrbits({
  brand = "#0ea5e9",
  size = "md",
  className,
}: LoadingOrbitsProps) {
  return (
    <div className={cn("relative", SIZES[size], className)}>
      <span
        className="absolute inset-0 rounded-full border-2 border-transparent"
        style={{ borderTopColor: brand, animation: "auth-orbit 2s linear infinite" }}
      />
      <span
        className="absolute inset-[12%] rounded-full border-2 border-transparent"
        style={{ borderBottomColor: brand, animation: "auth-orbit 2.6s linear infinite reverse" }}
      />
      <span
        className="absolute inset-[24%] rounded-full border-2 border-transparent"
        style={{ borderTopColor: brand, animation: "auth-orbit 3.2s linear infinite" }}
      />
      <span
        className="absolute left-1/2 top-1/2 h-5 w-5 rounded-full"
        style={{
          background: brand,
          boxShadow: `0 0 24px ${brand}`,
          animation: "auth-core 2s ease-in-out infinite",
        }}
      />
    </div>
  );
}