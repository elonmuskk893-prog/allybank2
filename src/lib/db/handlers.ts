import { NextResponse } from "next/server";
import { usingMock } from "@/lib/db";
import { DbError } from "@/lib/db/error";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(status: number, errorCode?: string, error?: string, errorBody?: Record<string, unknown>) {
  return NextResponse.json({ errorCode, error, ...(errorBody ? { errorBody } : {}) }, { status });
}

type Handler = () => Promise<NextResponse>;

/**
 * Wraps a data-layer call, translating DbError into the standard error
 * envelope and unexpected errors into a 500.
 */
export async function route(fn: () => Promise<unknown>): Promise<NextResponse> {
  try {
    const data = await fn();
    const response = ok(data);
    return response;
  } catch (error) {
    if (error instanceof DbError) {
      return fail(error.status, error.code, error.message, error.errorBody);
    }
    console.error(error);
    return fail(500, "server_error", "Something went wrong.");
  }
}

export function withMockExtra<T extends { mockExtra?: Record<string, unknown> }>(data: T) {
  return data;
}

export { usingMock };