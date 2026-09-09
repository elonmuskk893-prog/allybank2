import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-public/auth/impersonate/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-public/auth/impersonate/")({
  server: {
    handlers: {
        DELETE: ({ request, params }) => call(h.DELETE, request, params),
        POST: ({ request, params }) => call(h.POST, request, params),
    },
  },
});
