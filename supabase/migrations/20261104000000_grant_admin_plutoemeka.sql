-- ============================================================================
-- Grant the admin role to the existing member Plutoemeka@gmail.com
--
-- Matching is case-insensitive: Supabase lower-cases addresses in auth.users,
-- while public.users keeps whatever was captured at sign-up
-- ("Plutoemeka@gmail.com" vs "plutoemeka@gmail.com").
--
-- public.is_admin() requires role = 'admin' AND status = 'active', so the
-- status is normalised to 'active' in the same statement — promoting a
-- suspended/disabled profile would otherwise have no effect.
--
-- The users_guard_self_update trigger only rewrites privileged columns when
-- auth.uid() is set, so running this as the table owner / in the Supabase SQL
-- editor (auth.uid() is null) applies the change.
--
-- Safe to re-run: idempotent, and it raises a notice rather than failing when
-- no matching account exists.
-- ============================================================================

do $$
declare
  target_email  text := 'plutoemeka@gmail.com';
  target_id     uuid;
  affected_rows int := 0;
begin
  -- 1. Resolve the account. auth.users is authoritative; public.users is the
  --    fallback for an install where the signup trigger never created a row.
  select id into target_id
  from auth.users
  where lower(email) = target_email
  limit 1;

  if target_id is null then
    select id into target_id
    from public.users
    where lower(email) = target_email
    limit 1;
  end if;

  if target_id is null then
    raise notice 'No account found for %, nothing changed.', target_email;
    return;
  end if;

  -- 2. Create the profile row if it is missing, then promote it.
  insert into public.users (
    id, email, first_name, last_name, role, status, account_number, kyc_status
  )
  select
    u.id,
    lower(u.email),
    coalesce(u.raw_user_meta_data ->> 'first_name', ''),
    coalesce(u.raw_user_meta_data ->> 'last_name', ''),
    'admin'::public.user_role,
    'active'::public.user_status,
    public.generate_account_number(),
    'not_submitted'::public.kyc_status
  from auth.users u
  where u.id = target_id
  on conflict (id) do update
    set role       = 'admin'::public.user_role,
        status     = 'active'::public.user_status,
        updated_at = now();

  get diagnostics affected_rows = row_count;

  -- 3. Make sure the companion rows the app expects also exist.
  insert into public.settings (user_id)
  values (target_id)
  on conflict (user_id) do nothing;

  insert into public.accounts (user_id, currency, balance, available, account_number, status)
  values (target_id, 'USD', 0, 0, public.generate_account_number(), 'active')
  on conflict (user_id, currency) do nothing;

  raise notice 'Granted admin to user % (%) — % row(s) updated.',
    target_email, target_id, affected_rows;
end $$;

-- Verify afterwards:
--   select id, email, role, status
--   from public.users
--   where lower(email) = 'plutoemeka@gmail.com';
