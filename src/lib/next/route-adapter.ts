/**
 * Adapts a Next.js-style route handler `(request, { params })` to a
 * TanStack Start server-route handler.
 */
type AnyHandler = (...args: never[]) => unknown;

export function call(
  handler: AnyHandler,
  request: Request,
  params?: Record<string, string | undefined>,
): Promise<Response> {
  const fn = handler as unknown as (
    request: Request,
    context: { params: Promise<Record<string, string | undefined>> },
  ) => Promise<Response> | Response;
  return Promise.resolve(fn(request, { params: Promise.resolve(params ?? {}) }));
}
