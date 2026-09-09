import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-sites/[slug]/admin/users/[id]/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-sites/$slug/admin/users/$id/")({
  server: {
    handlers: {
        DELETE: ({ request, params }) => call(h.DELETE, request, params),
        GET: ({ request, params }) => call(h.GET, request, params),
        PATCH: ({ request, params }) => call(h.PATCH, request, params),
    },
  },
});
