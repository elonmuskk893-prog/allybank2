<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

- Privileged balance mutations run only through service-role RPCs; browser roles must never receive execute access.

- Vercel installs with a clean `node_modules` (`installCommand` in vercel.json) — Vercel's build cache otherwise keeps stale nested packages (e.g. zod v3 instead of v4 under TanStack) and the build crashes after dependency upgrades.

- Per-user payment-detail masking lives in src/lib/db/masking.ts and is applied server-side in paymentMethods (never client-side, so real values never reach a masked member's browser); admin password/PIN resets go through adminUpdateUser — credentials are only ever hashed, never stored or logged in plain text.
