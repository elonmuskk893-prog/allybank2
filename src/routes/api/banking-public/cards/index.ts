import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-public/cards/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-public/cards/")({
  server: {
    handlers: {
        GET: ({ request, params }) => call(h.GET, request, params),
    },
  },
});
