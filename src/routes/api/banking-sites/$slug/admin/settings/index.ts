import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-sites/[slug]/admin/settings/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-sites/$slug/admin/settings/")({
  server: {
    handlers: {
        GET: ({ request, params }) => call(h.GET, request, params),
        PUT: ({ request, params }) => call(h.PUT, request, params),
    },
  },
});
