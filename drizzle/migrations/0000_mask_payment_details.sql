-- Per-user, admin-controlled visibility of deposit payment account details.
alter table public.users
  add column if not exists mask_payment_details boolean not null default false;

-- Self-updates must not be able to flip the new admin-controlled flag.
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