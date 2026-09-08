/**
 * Compatibility shim for `next/navigation`, backed by TanStack Router.
 * Lets the ported pages keep their original call sites.
 */
import {
  useNavigate,
  useRouter as useTsRouter,
  useLocation,
  useParams as useTsParams,
} from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

export function useRouter() {
  const navigate = useNavigate();
  const router = useTsRouter();

  const go = useCallback(
    (href: string, replace?: boolean) => {
      navigate({ to: href, replace } as never);
    },
    [navigate],
  );

  return useMemo(
    () => ({
      push: (href: string) => go(href, false),
      replace: (href: string) => go(href, true),
      back: () => router.history.back(),
      forward: () => router.history.forward(),
      refresh: () => router.invalidate(),
      prefetch: () => {},
    }),
    [go, router],
  );
}

export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParams(): URLSearchParams {
  const searchStr = useLocation().searchStr;
  return useMemo(() => new URLSearchParams(searchStr ?? ""), [searchStr]);
}

export function useParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>(): T {
  return useTsParams({ strict: false } as never) as T;
}

export function redirect(href: string): never {
  if (typeof window !== "undefined") window.location.href = href;
  throw new Error(`redirect:${href}`);
}

export function notFound(): never {
  throw new Error("not_found");
}
