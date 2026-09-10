# Grants, Tax Refund and admin access

## 1. Grants — connect the member pages to the admin panel

Today the "Apply" button in a member's account leads to a page that was never built, so it shows
"grants/apply is coming soon". The admin panel already stores grant programs and applications.

- Build the member application page: it lists the grant programs that are switched on in the admin
  panel (title, description, bullet points, maximum amount), lets the member pick a program, enter an
  amount and submit as an individual or a company.
- Submitted applications land in Admin → Grants, where the status (pending / approved / rejected /
  paid) can be changed; the member's Grants page reflects that status.
- Programs disabled in the admin panel disappear from the member page immediately.

## 2. Tax Refund (IRS) — build the missing member page

The "Tax Refund" entry in the member menu also lands on a placeholder. Admin → Tax Refunds already
stores refunds per member.

- Add a read-only member Tax Refund page showing that member's refunds: tax year, amount, status and
  admin notes, plus a friendly empty state when none exist.
- Add the matching member-side data endpoint so a member can only ever see their own refunds.

## 3. Admin access — one authorised email, no auth code

- Grant admin rights to **Plutoemeka@gmail.com** and remove admin rights from the existing
  `admin@teslamodel.xyz` account.
- Deactivate every master auth code and remove the code sign-in path entirely, so the admin login page
  only accepts email and password.
- Keep the server-side check that every admin action requires an active admin account, so no other
  account can reach the admin panel or its data even by calling it directly.
- If the password for Plutoemeka@gmail.com isn't known, "Forgot password" on the sign-in page will
  send a reset code to that address.

## 4. Login bounce-back

Investigate the redirect back to the login page after signing in: reproduce the sign-in in a real
browser session, follow the session cookie through to the admin check, and fix whatever drops it.

## 5. Security

After the changes, re-run the security scan and fix any legitimate new findings — in particular the
access rules on grant programs, grant applications and tax refunds (members read only their own rows,
only admins write).

## Technical notes

- New pages `src/pages/grants/apply/page.tsx` and `src/pages/irs-refunds/page.tsx` with matching
  TanStack routes; new member endpoint `api/banking-public/irs-refunds`.
- `loginMethod` always returns `email_password`; the `code` branch is removed from `login()` in both
  the Supabase and mock data layers, and the admin login page drops the code field.
- Role change and `admin_codes` deactivation applied as data updates; RLS/grants reviewed for
  `grant_programs`, `grants` and `irs_refunds`.
