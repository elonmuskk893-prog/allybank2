/**
 * Typed API client for the banking platform.
 *
 * All endpoints return a normalized envelope: `{ ok, status, data, errorCode, error }`.
 * Endpoints are currently stubbed to return empty data so the UI can be built and
 * browsed offline; wire these up to the real backend when it is implemented.
 */

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  errorCode?: string;
  error?: string;
  errorBody?: Record<string, unknown>;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      // Callers may pass an object (stringified here) or an already-stringified body.
      body:
        options.body === undefined
          ? undefined
          : typeof options.body === "string"
            ? options.body
            : JSON.stringify(options.body),
    });

    let payload: Record<string, unknown> | null = null;
    try {
      payload = await response.json();
    } catch {
      // Non-JSON response (e.g. empty body) is fine.
    }

    return {
      ok: response.ok,
      status: response.status,
      data: (payload?.data as T) ?? null,
      errorCode: typeof payload?.errorCode === "string" ? payload.errorCode : undefined,
      error: typeof payload?.error === "string" ? payload.error : undefined,
      errorBody:
        payload?.errorBody && typeof payload.errorBody === "object"
          ? (payload.errorBody as Record<string, unknown>)
          : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Public + authenticated endpoints for the currently viewed banking site.
 * Examples: /site-info, /me, /balance, /transactions, /cards, /notifications, ...
 */
export function bankFetch<T = unknown>(path: string, options?: RequestOptions) {
  return request<T>(`/api/banking-public${path}`, options);
}

/** Site-scoped endpoints (login, signup, ...) for a specific site slug. */
export function siteFetch<T = unknown>(
  slug: string,
  path: string,
  options?: RequestOptions,
) {
  return request<T>(`/api/banking-sites/${encodeURIComponent(slug)}${path}`, options);
}

/** Admin-only endpoints under a site's admin namespace. */
export function adminFetch<T = unknown>(
  slug: string,
  path: string,
  options?: RequestOptions,
) {
  return request<T>(
    `/api/banking-sites/${encodeURIComponent(slug)}/admin${path}`,
    options,
  );
}

/**
 * Handles an API error code and returns a human-readable message.
 * Falls back to the server-provided message or a generic default.
 */
export function errorMessage(
  errorCode: string | undefined,
  fallback?: string,
): string {
  switch (errorCode) {
    case "invalid_code":
      return "That code is wrong.";
    case "invalid_credentials":
      return "Email or password is incorrect.";
    case "too_many_attempts":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "twofa_email_failed":
      return "We couldn't email your code. Try again shortly.";
    case "challenge_expired":
      return "That took too long -- please sign in again.";
    default:
      return fallback ?? "Sign-in failed.";
  }
}