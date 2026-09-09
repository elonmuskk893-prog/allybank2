import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-sites/[slug]/admin/cards/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-sites/$slug/admin/cards/")({
  server: {
    handlers: {
        GET: ({ request, params }) => call(h.GET, request, params),
        POST: ({ request, params }) => call(h.POST, request, params),
    },
  },
});
