
-- 1. Block privileged column changes by non-admin end users
create or replace function public.guard_users_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.role := old.role;
  new.status := old.status;
  new.kyc_status := old.kyc_status;
  new.kyc_required := old.kyc_required;
  new.email := old.email;
  new.email_verified_at := old.email_verified_at;
  new.account_number := old.account_number;
  new.referral_code := old.referral_code;
  new.pin_hash := old.pin_hash;
  new.pin_gate := old.pin_gate;
  new.twofa_enabled := old.twofa_enabled;
  return new;
end $$;

drop trigger if exists users_guard_self_update on public.users;
create trigger users_guard_self_update
before update on public.users
for each row execute function public.guard_users_self_update();

create or replace function public.guard_accounts_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.balance := old.balance;
  new.available := old.available;
  new.status := old.status;
  new.currency := old.currency;
  new.account_number := old.account_number;
  new.user_id := old.user_id;
  return new;
end $$;

drop trigger if exists accounts_guard_self_update on public.accounts;
create trigger accounts_guard_self_update
before update on public.accounts
for each row execute function public.guard_accounts_self_update();

create or replace function public.guard_cards_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  -- users may only toggle the frozen flag on their own card
  new.user_id := old.user_id;
  new.brand := old.brand;
  new.card_type := old.card_type;
  new.last4 := old.last4;
  new.holder := old.holder;
  new.expiry := old.expiry;
  new.status := old.status;
  new.limit_amount := old.limit_amount;
  new.spent := old.spent;
  return new;
end $$;

drop trigger if exists cards_guard_self_update on public.cards;
create trigger cards_guard_self_update
before update on public.cards
for each row execute function public.guard_cards_self_update();

create or replace function public.guard_settings_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.user_id := old.user_id;
  if jsonb_typeof(new.notifications) is distinct from 'object' then
    new.notifications := old.notifications;
  end if;
  if jsonb_typeof(new.security) is distinct from 'object' then
    new.security := old.security;
  end if;
  -- security-relevant flags are authoritative on public.users, not this blob
  new.security := (old.security - 'twofa_enabled' - 'pin_gate')
                  || (new.security - 'twofa_enabled' - 'pin_gate')
                  || jsonb_build_object(
                       'twofa_enabled', coalesce(old.security->'twofa_enabled', 'false'::jsonb),
                       'pin_gate', coalesce(old.security->'pin_gate', 'false'::jsonb)
                     );
  return new;
end $$;

drop trigger if exists settings_guard_self_update on public.settings;
create trigger settings_guard_self_update
before update on public.settings
for each row execute function public.guard_settings_self_update();

-- 2. Signed-in users must not call privileged SECURITY DEFINER money functions directly
revoke execute on function public.credit_account(uuid, numeric, text) from authenticated, anon, public;
revoke execute on function public.debit_account(uuid, numeric, text) from authenticated, anon, public;
revoke execute on function public.hold_funds(uuid, numeric, text) from authenticated, anon, public;
revoke execute on function public.release_hold(uuid, numeric, text) from authenticated, anon, public;
revoke execute on function public.settle_hold(uuid, numeric, text) from authenticated, anon, public;
revoke execute on function public.record_transaction(uuid, uuid, public.tx_kind, public.tx_direction, numeric, text, text, text, public.tx_status, numeric, numeric) from authenticated, anon, public;
revoke execute on function public.generate_account_number() from authenticated, anon, public;
revoke execute on function public.guard_users_self_update() from authenticated, anon, public;
revoke execute on function public.guard_accounts_self_update() from authenticated, anon, public;
revoke execute on function public.guard_cards_self_update() from authenticated, anon, public;
revoke execute on function public.guard_settings_self_update() from authenticated, anon, public;

grant execute on function public.credit_account(uuid, numeric, text) to service_role;
grant execute on function public.debit_account(uuid, numeric, text) to service_role;
grant execute on function public.hold_funds(uuid, numeric, text) to service_role;
grant execute on function public.release_hold(uuid, numeric, text) to service_role;
grant execute on function public.settle_hold(uuid, numeric, text) to service_role;
grant execute on function public.record_transaction(uuid, uuid, public.tx_kind, public.tx_direction, numeric, text, text, text, public.tx_status, numeric, numeric) to service_role;
grant execute on function public.generate_account_number() to service_role;
