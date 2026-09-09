import { createFileRoute } from "@tanstack/react-router";
import * as h from "@/api/banking-public/profile/route";
import { call } from "@/lib/next/route-adapter";

export const Route = createFileRoute("/api/banking-public/profile/")({
  server: {
    handlers: {
        PATCH: ({ request, params }) => call(h.PATCH, request, params),
    },
  },
});
