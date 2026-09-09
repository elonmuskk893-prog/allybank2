import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-sites/[slug]/admin/test-email/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-sites/$slug/admin/test-email/")({
  server: {
    handlers: {
      POST: ({ request, params }) => call(h.POST, request, params),
    },
  },
});
