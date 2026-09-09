ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS hold_settled_at timestamptz,
  ADD COLUMN IF NOT EXISTS hold_released_at timestamptz;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS hold_settled_at timestamptz,
  ADD COLUMN IF NOT EXISTS hold_released_at timestamptz;

CREATE OR REPLACE FUNCTION public.hold_funds(p_user_id uuid, p_amount numeric, p_currency text DEFAULT 'USD')
RETURNS public.accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  acc public.accounts;
begin
  if auth.uid() is null or (p_user_id <> auth.uid() and not public.is_admin()) then
    raise exception 'not_authorized';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;
  select * into acc from public.accounts
    where user_id = p_user_id and currency = p_currency and status = 'active'
    for update;
  if not found then
    raise exception 'no_active_account';
  end if;
  if acc.available < p_amount then
    raise exception 'insufficient_funds';
  end if;
  update public.accounts
     set available = available - p_amount
   where id = acc.id
  returning * into acc;
  return acc;
end $$;

CREATE OR REPLACE FUNCTION public.release_hold(p_user_id uuid, p_amount numeric, p_currency text DEFAULT 'USD')
RETURNS public.accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  acc public.accounts;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;
  select * into acc from public.accounts
    where user_id = p_user_id and currency = p_currency
    for update;
  if not found then
    raise exception 'no_active_account';
  end if;
  update public.accounts
     set available = least(balance, available + p_amount)
   where id = acc.id
  returning * into acc;
  return acc;
end $$;

CREATE OR REPLACE FUNCTION public.settle_hold(p_user_id uuid, p_amount numeric, p_currency text DEFAULT 'USD')
RETURNS public.accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  acc public.accounts;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;
  select * into acc from public.accounts
    where user_id = p_user_id and currency = p_currency
    for update;
  if not found then
    raise exception 'no_active_account';
  end if;
  update public.accounts
     set balance = balance - p_amount,
         available = least(available, balance - p_amount)
   where id = acc.id
  returning * into acc;
  return acc;
end $$;

REVOKE ALL ON FUNCTION public.hold_funds(uuid, numeric, text) FROM public;
REVOKE ALL ON FUNCTION public.release_hold(uuid, numeric, text) FROM public;
REVOKE ALL ON FUNCTION public.settle_hold(uuid, numeric, text) FROM public;
GRANT EXECUTE ON FUNCTION public.hold_funds(uuid, numeric, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_hold(uuid, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_hold(uuid, numeric, text) TO service_role;