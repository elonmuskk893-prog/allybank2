
-- Helper: compare submitted values against the stored row so self-updates
-- cannot alter privileged columns. Admin/service-role paths are exempt.

create or replace function public.users_self_update_allowed(
  p_id uuid, p_role public.user_role, p_status public.user_status,
  p_kyc_status public.kyc_status, p_kyc_required boolean, p_email text,
  p_account_number text, p_pin_hash text, p_pin_gate boolean, p_twofa boolean
) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is null or public.is_admin() or exists (
    select 1 from public.users u
    where u.id = p_id
      and u.role = p_role and u.status = p_status
      and u.kyc_status = p_kyc_status and u.kyc_required = p_kyc_required
      and u.email = p_email
      and u.account_number is not distinct from p_account_number
      and u.pin_hash is not distinct from p_pin_hash
      and u.pin_gate = p_pin_gate and u.twofa_enabled = p_twofa
  );
$$;

create or replace function public.accounts_self_update_allowed(
  p_id uuid, p_balance numeric, p_available numeric,
  p_status public.account_status, p_currency text, p_user_id uuid
) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is null or public.is_admin() or exists (
    select 1 from public.accounts a
    where a.id = p_id and a.balance = p_balance and a.available = p_available
      and a.status = p_status and a.currency = p_currency and a.user_id = p_user_id
  );
$$;

create or replace function public.cards_self_update_allowed(
  p_id uuid, p_limit numeric, p_spent numeric,
  p_status public.card_status, p_user_id uuid
) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is null or public.is_admin() or exists (
    select 1 from public.cards c
    where c.id = p_id
      and c.limit_amount is not distinct from p_limit
      and c.spent = p_spent and c.status = p_status and c.user_id = p_user_id
  );
$$;

create or replace function public.settings_self_update_allowed(
  p_user_id uuid, p_security jsonb
) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is null or public.is_admin() or exists (
    select 1 from public.settings s
    where s.user_id = p_user_id
      and coalesce(s.security->'twofa_enabled','false'::jsonb)
          is not distinct from coalesce(p_security->'twofa_enabled','false'::jsonb)
      and coalesce(s.security->'pin_gate','false'::jsonb)
          is not distinct from coalesce(p_security->'pin_gate','false'::jsonb)
  );
$$;

revoke all on function public.users_self_update_allowed(uuid, public.user_role, public.user_status, public.kyc_status, boolean, text, text, text, boolean, boolean) from public, anon;
revoke all on function public.accounts_self_update_allowed(uuid, numeric, numeric, public.account_status, text, uuid) from public, anon;
revoke all on function public.cards_self_update_allowed(uuid, numeric, numeric, public.card_status, uuid) from public, anon;
revoke all on function public.settings_self_update_allowed(uuid, jsonb) from public, anon;

grant execute on function public.users_self_update_allowed(uuid, public.user_role, public.user_status, public.kyc_status, boolean, text, text, text, boolean, boolean) to authenticated, service_role;
grant execute on function public.accounts_self_update_allowed(uuid, numeric, numeric, public.account_status, text, uuid) to authenticated, service_role;
grant execute on function public.cards_self_update_allowed(uuid, numeric, numeric, public.card_status, uuid) to authenticated, service_role;
grant execute on function public.settings_self_update_allowed(uuid, jsonb) to authenticated, service_role;

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated
  using (public.is_self(id))
  with check (
    public.is_self(id)
    and public.users_self_update_allowed(id, role, status, kyc_status, kyc_required, email, account_number, pin_hash, pin_gate, twofa_enabled)
  );

drop policy if exists accounts_update_own on public.accounts;
create policy accounts_update_own on public.accounts
  for update to authenticated
  using (public.is_self(user_id))
  with check (
    public.is_self(user_id)
    and public.accounts_self_update_allowed(id, balance, available, status, currency, user_id)
  );

drop policy if exists cards_update_own on public.cards;
create policy cards_update_own on public.cards
  for update to authenticated
  using (public.is_self(user_id))
  with check (
    public.is_self(user_id)
    and public.cards_self_update_allowed(id, limit_amount, spent, status, user_id)
  );

drop policy if exists settings_update_own on public.settings;
create policy settings_update_own on public.settings
  for update to authenticated
  using (public.is_self(user_id))
  with check (
    public.is_self(user_id)
    and public.settings_self_update_allowed(user_id, security)
  );
