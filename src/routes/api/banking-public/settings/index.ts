import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-public/settings/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-public/settings/")({
  server: {
    handlers: {
        GET: ({ request, params }) => call(h.GET, request, params),
        PATCH: ({ request, params }) => call(h.PATCH, request, params),
    },
  },
});
