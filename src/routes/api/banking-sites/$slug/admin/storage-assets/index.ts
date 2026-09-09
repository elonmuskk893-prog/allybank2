import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-sites/[slug]/admin/storage-assets/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-sites/$slug/admin/storage-assets/")({
  server: {
    handlers: {
        DELETE: ({ request, params }) => call(h.DELETE, request, params),
        GET: ({ request, params }) => call(h.GET, request, params),
    },
  },
});
