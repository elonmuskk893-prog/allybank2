import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-public/withdrawal/cancel/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-public/withdrawal/cancel/")({
  server: {
    handlers: {
      POST: ({ request, params }) => call(h.POST, request, params),
    },
  },
});
