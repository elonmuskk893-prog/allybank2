import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-public/deposit/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-public/deposit/")({
  server: {
    handlers: {
        POST: ({ request, params }) => call(h.POST, request, params),
    },
  },
});
