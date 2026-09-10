CREATE OR REPLACE FUNCTION public.hold_funds(p_user_id uuid, p_amount numeric, p_currency text DEFAULT 'USD')
RETURNS public.accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  acc public.accounts;
begin
  -- auth.uid() is null when called by the trusted server (service role).
  if auth.uid() is not null and p_user_id <> auth.uid() and not public.is_admin() then
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

REVOKE ALL ON FUNCTION public.hold_funds(uuid, numeric, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hold_funds(uuid, numeric, text) TO service_role;