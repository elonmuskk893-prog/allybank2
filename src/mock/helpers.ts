import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MOCK_USER, SITE } from "./data";

/** Standard success envelope used across the mock API. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

/** Standard error envelope used across the mock API. */
export function fail(status: number, errorCode?: string, error?: string) {
  return NextResponse.json({ errorCode, error }, { status });
}

export const SESSION_COOKIE = "mock_admin_session";

/** Whether the mock admin session cookie is present. */
export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.has(SESSION_COOKIE);
}

/** Seed data re-exported for route handlers. */
export { MOCK_USER, SITE };