import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-sites/[slug]/admin/currencies/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-sites/$slug/admin/currencies/")({
  server: {
    handlers: {
        DELETE: ({ request, params }) => call(h.DELETE, request, params),
        GET: ({ request, params }) => call(h.GET, request, params),
        POST: ({ request, params }) => call(h.POST, request, params),
    },
  },
});
