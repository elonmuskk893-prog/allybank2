CREATE OR REPLACE FUNCTION public.debit_account(p_user_id uuid, p_amount numeric, p_currency text DEFAULT 'USD'::text)
RETURNS public.accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  acc public.accounts;
begin
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
  if acc.balance < p_amount then
    raise exception 'insufficient_funds';
  end if;
  update public.accounts
     set balance = balance - p_amount,
         available = greatest(0, available - p_amount)
   where id = acc.id
  returning * into acc;
  return acc;
end $function$;

REVOKE EXECUTE ON FUNCTION public.debit_account(uuid, numeric, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.debit_account(uuid, numeric, text) TO service_role;