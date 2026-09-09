import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-public/beneficiaries/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-public/beneficiaries/")({
  server: {
    handlers: {
        GET: ({ request, params }) => call(h.GET, request, params),
        POST: ({ request, params }) => call(h.POST, request, params),
    },
  },
});
