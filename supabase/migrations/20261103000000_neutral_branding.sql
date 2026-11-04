-- Move existing installs off the previous brand defaults.

alter table public.sites alter column name set default 'Account Dashboard';

update public.sites
set slug = 'account-dashboard',
    name = 'Account Dashboard',
    logo_url = case
      when logo_url ilike '%allybank%' or logo_url ilike '%tesla%' then '/logo.jpeg'
      else logo_url
    end
where id = 1;

update public.notifications
set title = replace(title, 'Tesla Model', 'Account Dashboard'),
    body = replace(body, 'Tesla Model', 'Account Dashboard')
where title ilike '%Tesla Model%' or body ilike '%Tesla Model%';

drop policy if exists "sites_select_public" on public.sites;
drop policy if exists "sites_select_active_site" on public.sites;
create policy "sites_select_active_site"
on public.sites
for select
to anon, authenticated
using (id = 1 or public.is_admin());

update public.faqs
set answer = 'Click Sign Up, fill in your details and verify your email address. Your account is ready after verification.'
where question = 'How do I open an account?';

update public.faqs
set answer = 'Withdrawals are reviewed before processing. The estimated timing for your selected method is shown before you submit the request.'
where question = 'How long does a withdrawal take?';

update public.faqs
set answer = 'Go to Settings → Verification and submit a government-issued ID. Review times vary.'
where question = 'How do I verify my identity?';

-- Seeded programs promised unverified payouts. Keep the module, but require an
-- admin to review and re-enable a program before it is shown publicly.
update public.grant_programs
set enabled = false
where title in (
  'Small Business Grant',
  'Education Grant',
  'Home Ownership Grant',
  'Emergency Relief Grant',
  'Community Development',
  'Healthcare Grant'
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  site_id int;
begin
  insert into public.users (id, email, first_name, last_name, role, status, account_number, kyc_status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    'user'::public.user_role,
    'active'::public.user_status,
    coalesce(new.raw_user_meta_data->>'account_number', public.generate_account_number()),
    'not_submitted'::public.kyc_status
  )
  on conflict (id) do update set email = excluded.email;

  insert into public.accounts (user_id, currency, balance, available, account_number, status)
  values (new.id, 'USD', 0, 0, public.generate_account_number(), 'active')
  on conflict (user_id, currency) do nothing;

  insert into public.crypto_assets (user_id, symbol, name, balance)
  values (new.id, 'BTC', 'Bitcoin', 0), (new.id, 'ETH', 'Ethereum', 0)
  on conflict (user_id, symbol) do nothing;

  insert into public.settings (user_id) values (new.id) on conflict do nothing;

  select id into site_id from public.sites limit 1;
  if site_id is null then
    insert into public.sites (slug, name) values ('account-dashboard', 'Account Dashboard');
  end if;

  insert into public.notifications (user_id, title, body)
  values (new.id, 'Welcome to Account Dashboard', 'Your account is ready. Complete your KYC to unlock all features.');

  return new;
end $$;
