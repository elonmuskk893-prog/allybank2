import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-public/me/pin/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-public/me/pin/")({
  server: {
    handlers: {
        POST: ({ request, params }) => call(h.POST, request, params),
    },
  },
});
