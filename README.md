# Online Banking

TanStack Start application with a Supabase backend and a Vercel-compatible Nitro server build.

## Local development

1. Create `.env.local` using the variable list below.
2. Fill in the public and server Supabase values from a project you control.
3. Run `bun install` and `bun run dev`.

Mock data is disabled by default. It can be enabled only for isolated local UI work with
`ALLOW_MOCK_DB=true`; never enable it in a deployed environment.

## Vercel deployment

Connect Vercel to this repository and use `main` as the Production Branch. The checked-in
`vercel.json` runs `bun run build`, and Nitro emits Vercel's server output.

Add these variables to **Production, Preview, and Development** in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

Optional email variables are `RESEND_API_KEY` or `MAILERSEND_API_KEY`, plus
`EMAIL_FROM_NAME` and `EMAIL_FROM_ADDRESS`. SMTP can instead be configured in the admin
settings. If scheduled endpoints are used, add a strong `CRON_SECRET` to Vercel.

Never create a `VITE_SUPABASE_SERVICE_ROLE_KEY`; any `VITE_` value is bundled for browsers.
Never set `ALLOW_MOCK_DB=true` on Vercel.

## Independent backend migration

The live backend runs on Supabase. To move it, create a new project
in your own Supabase account, restore the schema and data, migrate authentication users with
their IDs intact, and copy the private `uploads` bucket. Validate the migration in a Vercel
Preview deployment before changing Production variables or the custom domain.
