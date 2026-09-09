import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-sites/[slug]/admin/users/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-sites/$slug/admin/users/")({
  server: {
    handlers: {
        GET: ({ request, params }) => call(h.GET, request, params),
    },
  },
});
