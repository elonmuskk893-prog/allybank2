/** Compatibility shim for `next/server` response helpers. */

export type NextRequest = Request;

export const NextResponse = {
  json(body: unknown, init?: ResponseInit): Response {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...((init?.headers as Record<string, string>) ?? {}),
      },
    });
  },
  redirect(url: string | URL, status = 302): Response {
    return new Response(null, { status, headers: { location: String(url) } });
  },
  next(): Response {
    return new Response(null, { status: 200 });
  },
};
