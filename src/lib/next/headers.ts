/**
 * Compatibility shim for `next/headers`, backed by TanStack Start's
 * request-scoped server helpers.
 */
import {
  getCookie,
  setCookie,
  deleteCookie,
  getRequestHeaders,
  getRequestHeader,
} from "@tanstack/react-start/server";

export interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: boolean | "lax" | "strict" | "none";
  partitioned?: boolean;
}

export interface CookieRecord {
  name: string;
  value: string;
}

function parseAll(): CookieRecord[] {
  const header = getRequestHeader("cookie") ?? "";
  if (!header) return [];
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const idx = part.indexOf("=");
      const name = idx === -1 ? part : part.slice(0, idx);
      const value = idx === -1 ? "" : part.slice(idx + 1);
      return { name, value: decodeURIComponent(value) };
    });
}

export interface CookieStore {
  get(name: string): CookieRecord | undefined;
  getAll(): CookieRecord[];
  set(name: string, value: string, options?: CookieOptions): void;
  set(cookie: { name: string; value: string } & CookieOptions): void;
  delete(name: string): void;
  has(name: string): boolean;
}

const store: CookieStore = {
  get(name: string) {
    const value = getCookie(name);
    return value === undefined ? undefined : { name, value };
  },
  getAll() {
    return parseAll();
  },
  set(
    nameOrCookie: string | ({ name: string; value: string } & CookieOptions),
    value?: string,
    options?: CookieOptions,
  ) {
    if (typeof nameOrCookie === "string") {
      setCookie(nameOrCookie, value ?? "", (options ?? {}) as never);
      return;
    }
    const { name, value: v, ...opts } = nameOrCookie;
    setCookie(name, v, opts as never);
  },
  delete(name: string) {
    deleteCookie(name);
  },
  has(name: string) {
    return getCookie(name) !== undefined;
  },
};

export async function cookies(): Promise<CookieStore> {
  return store;
}

export async function headers(): Promise<Headers> {
  return new Headers((getRequestHeaders() ?? {}) as unknown as Record<string, string>);
}
