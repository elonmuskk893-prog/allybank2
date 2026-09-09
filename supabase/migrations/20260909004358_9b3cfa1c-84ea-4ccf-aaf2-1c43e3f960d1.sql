-- ---------------------------------------------------------------- grants
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t.tablename);
    execute format('grant all on public.%I to service_role', t.tablename);
  end loop;
end $$;

-- publicly readable content tables
grant select on public.sites to anon;
grant select on public.site_currencies to anon;
grant select on public.payment_methods to anon;
grant select on public.faqs to anon;
grant select on public.testimonials to anon;
grant insert on public.contact_messages to anon;
grant insert on public.leads to anon;

drop policy if exists "contact_messages_insert_public" on public.contact_messages;
create policy "contact_messages_insert_public" on public.contact_messages
  for insert to anon, authenticated with check (true);

drop policy if exists "leads_insert_public" on public.leads;
create policy "leads_insert_public" on public.leads
  for insert to anon, authenticated with check (true);

-- --------------------------------------------------- safe helper functions
create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.generate_account_number()
returns text
language plpgsql security invoker set search_path = public as $$
declare
  num text;
begin
  loop
    num := lpad(floor(random() * 9000000000 + 1000000000)::bigint::text, 10, '0');
    exit when not exists (select 1 from public.users where account_number = num)
              and not exists (select 1 from public.accounts where account_number = num);
  end loop;
  return num;
end $$;

-- money helpers: only for your own account, or staff
create or replace function public.debit_account(
  p_user_id uuid,
  p_amount numeric,
  p_currency text default 'USD'
)
returns public.accounts
language plpgsql security definer set search_path = public
as $$
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
  if acc.balance < p_amount then
    raise exception 'insufficient_funds';
  end if;
  update public.accounts
     set balance = balance - p_amount,
         available = available - p_amount
   where id = acc.id
  returning * into acc;
  return acc;
end $$;

create or replace function public.credit_account(
  p_user_id uuid,
  p_amount numeric,
  p_currency text default 'USD'
)
returns public.accounts
language plpgsql security definer set search_path = public
as $$
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
  update public.accounts
     set balance = balance + p_amount,
         available = available + p_amount
   where id = acc.id
  returning * into acc;
  return acc;
end $$;

-- lock down execution
revoke all on function public.debit_account(uuid, numeric, text) from public, anon;
revoke all on function public.credit_account(uuid, numeric, text) from public, anon;
grant execute on function public.debit_account(uuid, numeric, text) to authenticated, service_role;
grant execute on function public.credit_account(uuid, numeric, text) to authenticated, service_role;

revoke all on function public.record_transaction(uuid, uuid, public.tx_kind, public.tx_direction, numeric, text, text, text, public.tx_status, numeric, numeric) from public, anon, authenticated;
grant execute on function public.record_transaction(uuid, uuid, public.tx_kind, public.tx_direction, numeric, text, text, text, public.tx_status, numeric, numeric) to service_role;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- is_admin / is_self are required by row-level security policies, so signed-in
-- roles keep execute; they only report the caller's own admin state.
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_self(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_self(uuid) to authenticated, service_role;
