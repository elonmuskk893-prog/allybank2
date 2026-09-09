import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-public/beneficiaries/[id]/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-public/beneficiaries/$id/")({
  server: {
    handlers: {
        DELETE: ({ request, params }) => call(h.DELETE, request, params),
        PATCH: ({ request, params }) => call(h.PATCH, request, params),
    },
  },
});
