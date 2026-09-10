# Independent Vercel and Supabase Production

## Current state

- The working Lovable preview uses **Lovable Cloud**, backed by a Lovable-managed Supabase project. It is not an external Supabase project owned independently by the user.
- That backend currently provides authentication, user/profile records, accounts and balances, transactions, approvals, admin data, the private `uploads` storage bucket, and saved email/settings configuration.
- Most application APIs run in the TanStack Start server runtime. They use a server-only Supabase service-role credential for privileged banking and admin operations.
- Email is sent server-side using either saved SMTP settings or Resend/MailerSend environment credentials.
- The Vercel site is not connected to the real backend. Its public site record is the built-in sample “Tesla Model,” while the working deployment returns “AllyBank.” Missing backend variables make the application silently select its in-memory demo database.
- GitHub repository `elonmuskk893-prog/allybank2` has only `main`. Vercel successfully deployed GitHub commit `344b9df`, but the current Lovable commits are newer and are not present in GitHub. This explains missing changes.
- The current server build defaults to a Cloudflare target. It needs an explicit Vercel-compatible server output.

## Migration approach

1. **Create a user-owned Supabase project**
   - Create a new Supabase project in the user’s own Supabase organization.
   - Keep the existing Lovable backend unchanged until migration and verification finish.

2. **Export and restore the full backend**
   - Export schema, enum types, functions, triggers, grants, RLS policies, and table data from the current backend.
   - Export authentication users while preserving IDs so account, balance, transaction, and approval relationships remain intact.
   - Restore all database records into the new project and validate row counts and critical totals.
   - Copy every object from the private `uploads` bucket and recreate its access policies.
   - Preserve the sole-admin restriction for `Plutoemeka@gmail.com`.

3. **Make backend configuration fail safely**
   - Remove the automatic production fallback to sample/mock banking data.
   - Permit mock data only under an explicit local-development flag.
   - Fail startup/API requests clearly when required backend variables are missing.
   - Remove the insecure fallback used to sign impersonation sessions.

4. **Prepare the app for Vercel**
   - Configure Nitro/TanStack Start for Vercel’s Node.js server runtime.
   - Preserve server-side API routes and SSR behavior.
   - Ensure email paths using SMTP run in Node, not Edge.
   - Add the minimal Vercel configuration and document the expected build/output settings.

5. **Configure Vercel environments securely**
   - Add public variables to Production, Preview, and Development: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
   - Add server variables to Production, Preview, and Development: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   - Add email variables only when environment-based email is used: `RESEND_API_KEY` or `MAILERSEND_API_KEY`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`.
   - Add a new independently generated cron secret if scheduled endpoints are used.
   - Never expose the service-role key through a `VITE_` variable or frontend response.

6. **Repair GitHub → Vercel synchronization**
   - Bring the current Lovable work onto GitHub `main` through the existing Lovable GitHub synchronization flow.
   - Confirm Vercel’s production branch is `main`, framework/build settings match the repository, and automatic deployments are enabled.
   - Compare the GitHub commit SHA with Vercel’s deployment source SHA after every release.

7. **Cut over and verify**
   - First deploy a Vercel Preview against the new user-owned Supabase project.
   - Verify login, admin authorization, balances, transactions, deposit/withdrawal/transfer holds and approvals, grants/refunds, settings, notifications, uploads, password reset, 2FA, and email delivery.
   - Confirm the same migrated records appear on Vercel and that writes persist after refresh.
   - Push a harmless visible change through Lovable → GitHub and confirm Vercel automatically creates a deployment for that exact commit.
   - After verification, promote to Production and point the custom domain at Vercel. Keep the old backend intact temporarily for rollback.

## Required user-controlled access

- A new Supabase project created in the user’s own Supabase account.
- Access to the Vercel project settings so its encrypted environment variables and production branch can be configured.
- The existing GitHub connection is readable and confirms the repository/deployments, but Vercel account settings are not connected to this workspace.

## Safety and rollback

- No current users, balances, transactions, files, or credentials will be deleted during preparation.
- Production cutover happens only after a complete Preview verification.
- The current backend remains read-only as a rollback source until the user confirms the Vercel production deployment is correct.
