import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-sites/[slug]/admin/grant-programs/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-sites/$slug/admin/grant-programs/")({
  server: {
    handlers: {
      GET: ({ request, params }) => call(h.GET, request, params),
      POST: ({ request, params }) => call(h.POST, request, params),
      DELETE: ({ request, params }) => call(h.DELETE, request, params),
    },
  },
});
