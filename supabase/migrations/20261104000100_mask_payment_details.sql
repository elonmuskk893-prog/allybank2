-- ============================================================================
-- Per-member visibility of deposit payment (bank) details.
--
-- The admin user page exposes a "Bank details: Hide / Show" toggle that writes
-- public.users.mask_payment_details. The column previously only existed in the
-- Drizzle schema, so installs created from supabase/migrations were missing it
-- and the toggle failed with a database error.
--
-- Idempotent: safe to re-run on databases that already have the column.
-- ============================================================================

alter table public.users
  add column if not exists mask_payment_details boolean not null default false;

-- Self-service updates must never be able to flip the admin-controlled flag.
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
  new.mask_payment_details := old.mask_payment_details;
  return new;
end $$;

revoke execute on function public.guard_users_self_update() from authenticated, anon, public;

-- Admins read and write this flag through the service role; members only read
-- their own row via the existing select policy.
create index if not exists users_mask_payment_details_idx
  on public.users(mask_payment_details)
  where mask_payment_details;
