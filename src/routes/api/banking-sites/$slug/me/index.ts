import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-sites/[slug]/me/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-sites/$slug/me/")({
  server: {
    handlers: {
        GET: ({ request, params }) => call(h.GET, request, params),
    },
  },
});
