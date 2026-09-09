import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-public/auth/login/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-public/auth/login/")({
  server: {
    handlers: {
        POST: ({ request, params }) => call(h.POST, request, params),
    },
  },
});
