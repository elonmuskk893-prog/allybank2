-- ============================================================================
-- Account Platform — Initial schema
-- PostgreSQL for Supabase. Idempotent-friendly: each section drops/creates
-- cleanly so it can be re-run from scratch.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status as enum ('active', 'suspended', 'disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.kyc_status as enum ('pending', 'in_review', 'verified', 'rejected', 'not_submitted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_status as enum ('active', 'frozen', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tx_kind as enum ('deposit', 'withdrawal', 'transfer', 'card-spend', 'card-refund', 'fee', 'loan-repay', 'plan-debit', 'credited', 'grant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tx_direction as enum ('credit', 'debit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tx_status as enum ('pending', 'completed', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.card_status as enum ('active', 'frozen', 'blocked', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.req_status as enum ('pending', 'processing', 'completed', 'failed', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.loan_status as enum ('pending', 'approved', 'active', 'paid', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.grant_status as enum ('pending', 'approved', 'paid', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  first_name          text not null default '',
  last_name           text not null default '',
  full_name           text generated always as (trim(both ' ' from first_name || ' ' || last_name)) stored,
  photo_url           text,
  phone               text,
  country             text default 'US',
  currency            text default 'USD',
  role                public.user_role not null default 'user',
  status              public.user_status not null default 'active',
  kyc_status          public.kyc_status not null default 'not_submitted',
  kyc_required        boolean not null default true,
  email_verified_at   timestamptz,
  pin_hash            text,
  pin_gate            boolean not null default false,
  account_number      text,
  referral_code       text,
  twofa_enabled       boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (email),
  unique (account_number)
);

create index if not exists users_role_idx on public.users(role);
create index if not exists users_status_idx on public.users(status);
create index if not exists users_kyc_idx on public.users(kyc_status);

-- ---------------------------------------------------------------------------
-- Bank site config (singleton row, id always 1)
-- ---------------------------------------------------------------------------
create table if not exists public.sites (
  id                int primary key default 1 check (id = 1),
  slug              text not null,
  name              text not null default 'Account Dashboard',
  brand_color       text not null default '#0ea5e9',
  primary_currency  text not null default 'USD',
  kyc_required      boolean not null default true,
  logo_url          text,
  created_at        timestamptz not null default now(),
  unique (slug)
);

-- ---------------------------------------------------------------------------
-- Accounts / wallets
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  currency        text not null default 'USD',
  balance         numeric(20,2) not null default 0,
  available       numeric(20,2) not null default 0,
  account_number  text,
  status          public.account_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, currency)
);

create index if not exists accounts_user_idx on public.accounts(user_id);

-- ---------------------------------------------------------------------------
-- Transactions
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  account_id    uuid references public.accounts(id) on delete set null,
  kind          public.tx_kind not null,
  direction     public.tx_direction not null,
  amount        numeric(20,2) not null check (amount >= 0),
  currency      text not null default 'USD',
  name          text,
  reference     text,
  status        public.tx_status not null default 'completed',
  fee           numeric(20,2) not null default 0 check (fee >= 0),
  balance_after numeric(20,2),
  created_at    timestamptz not null default now()
);

create index if not exists transactions_user_idx on public.transactions(user_id, created_at desc);
create index if not exists transactions_user_kind_idx on public.transactions(user_id, kind);

-- ---------------------------------------------------------------------------
-- Cards
-- ---------------------------------------------------------------------------
create table if not exists public.cards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  brand         text not null default 'standard',
  card_type     text not null default 'credit',
  last4         text not null,
  holder        text not null,
  expiry        text not null,
  status        public.card_status not null default 'active',
  limit_amount  numeric(20,2),
  spent         numeric(20,2) not null default 0,
  frozen        boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists cards_user_idx on public.cards(user_id);

-- ---------------------------------------------------------------------------
-- Beneficiaries
-- ---------------------------------------------------------------------------
create table if not exists public.beneficiaries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  name           text not null,
  bank           text,
  account_number text,
  routing        text,
  email          text,
  currency       text not null default 'USD',
  nickname       text,
  created_at     timestamptz not null default now()
);

create index if not exists beneficiaries_user_idx on public.beneficiaries(user_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  title      text not null,
  body       text,
  link       text,
  icon       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Deposits / withdrawals
-- ---------------------------------------------------------------------------
create table if not exists public.deposits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  method     text not null,
  amount     numeric(20,2) not null check (amount > 0),
  currency   text not null default 'USD',
  reference  text,
  status     public.req_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists deposits_user_idx on public.deposits(user_id, created_at desc);

create table if not exists public.withdrawals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  method         text not null,
  amount         numeric(20,2) not null check (amount > 0),
  currency       text not null default 'USD',
  account_number text,
  reference      text,
  status         public.req_status not null default 'pending',
  created_at     timestamptz not null default now()
);

create index if not exists withdrawals_user_idx on public.withdrawals(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Crypto assets
-- ---------------------------------------------------------------------------
create table if not exists public.crypto_assets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  symbol     text not null,
  name       text not null default '',
  balance    numeric(30,8) not null default 0,
  price_usd  numeric(30,8),
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index if not exists crypto_user_idx on public.crypto_assets(user_id);

-- ---------------------------------------------------------------------------
-- Loans / grants
-- ---------------------------------------------------------------------------
create table if not exists public.loans (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  amount         numeric(20,2) not null check (amount > 0),
  interest_rate  numeric(5,2) not null default 0,
  term_months    int,
  status         public.loan_status not null default 'pending',
  created_at     timestamptz not null default now()
);

create index if not exists loans_user_idx on public.loans(user_id);

create table if not exists public.grants (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  program    text not null,
  amount     numeric(20,2),
  status     public.grant_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists grants_user_idx on public.grants(user_id);

-- ---------------------------------------------------------------------------
-- Admin access + master auth codes
-- ---------------------------------------------------------------------------
create table if not exists public.admin_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  code_hash   text not null,
  label       text not null default 'master',
  active      boolean not null default true,
  last_used_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists admin_codes_user_idx on public.admin_codes(user_id);

-- ---------------------------------------------------------------------------
-- Two-factor challenge codes
-- ---------------------------------------------------------------------------
create table if not exists public.twofa_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  code_hash   text not null,
  challenge   text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists twofa_challenge_idx on public.twofa_codes(challenge);

-- ---------------------------------------------------------------------------
-- Password resets (code-based)
-- ---------------------------------------------------------------------------
create table if not exists public.password_resets (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  code_hash  text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists password_resets_email_idx on public.password_resets(email);

-- ---------------------------------------------------------------------------
-- User settings
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  user_id       uuid primary key references public.users(id) on delete cascade,
  language      text not null default 'en',
  currency      text not null default 'USD',
  notifications jsonb not null default '{}'::jsonb,
  security      jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Card applications
-- ---------------------------------------------------------------------------
create table if not exists public.card_applications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  card_type  text not null default 'credit',
  status     public.req_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Functions & triggers
-- ---------------------------------------------------------------------------

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$ begin
  create trigger users_updated_at before update on public.users
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger accounts_updated_at before update on public.accounts
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger settings_updated_at before update on public.settings
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- Create a user row + default wallet + crypto assets when an auth user signs up.
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

do $$ begin
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
exception when duplicate_object then null; end $$;

-- Random account number generator (10 digits, unique).
create or replace function public.generate_account_number()
returns text
language plpgsql as $$
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

-- Atomically debit a user's account; raises if insufficient funds.
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

-- Atomically credit a user's account.
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

-- Record a transaction and return it.
create or replace function public.record_transaction(
  p_user_id uuid,
  p_account_id uuid,
  p_kind public.tx_kind,
  p_direction public.tx_direction,
  p_amount numeric,
  p_currency text default 'USD',
  p_name text default null,
  p_reference text default null,
  p_status public.tx_status default 'completed',
  p_fee numeric default 0,
  p_balance_after numeric default null
)
returns public.transactions
language plpgsql security definer set search_path = public
as $$
declare
  tx public.transactions;
begin
  insert into public.transactions
    (user_id, account_id, kind, direction, amount, currency, name, reference, status, fee, balance_after)
  values
    (p_user_id, p_account_id, p_kind, p_direction, p_amount, p_currency, p_name, p_reference, p_status, p_fee, p_balance_after)
  returning * into tx;
  return tx;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users        enable row level security;
alter table public.accounts     enable row level security;
alter table public.transactions enable row level security;
alter table public.cards        enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.notifications enable row level security;
alter table public.deposits     enable row level security;
alter table public.withdrawals  enable row level security;
alter table public.crypto_assets enable row level security;
alter table public.loans        enable row level security;
alter table public.grants       enable row level security;
alter table public.admin_codes  enable row level security;
alter table public.twofa_codes  enable row level security;
alter table public.settings     enable row level security;
alter table public.card_applications enable row level security;
alter table public.sites        enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

-- Helper: is the current user allowed to touch a row for this user?
create or replace function public.is_self(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select p_user_id = auth.uid() or public.is_admin();
$$;

-- users: a user sees only their own row; admins see everyone.
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (public.is_self(id));

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (public.is_self(id));

-- accounts
drop policy if exists "accounts_select_own" on public.accounts;
create policy "accounts_select_own" on public.accounts
  for select using (public.is_self(user_id));

drop policy if exists "accounts_insert_own" on public.accounts;
create policy "accounts_insert_own" on public.accounts
  for insert with check (public.is_self(user_id));

drop policy if exists "accounts_update_own" on public.accounts;
create policy "accounts_update_own" on public.accounts
  for update using (public.is_self(user_id));

-- transactions
drop policy if exists "tx_select_own" on public.transactions;
create policy "tx_select_own" on public.transactions
  for select using (public.is_self(user_id));

drop policy if exists "tx_insert_own" on public.transactions;
create policy "tx_insert_own" on public.transactions
  for insert with check (public.is_self(user_id));

-- cards
drop policy if exists "cards_select_own" on public.cards;
create policy "cards_select_own" on public.cards
  for select using (public.is_self(user_id));

drop policy if exists "cards_insert_own" on public.cards;
create policy "cards_insert_own" on public.cards
  for insert with check (public.is_self(user_id));

drop policy if exists "cards_update_own" on public.cards;
create policy "cards_update_own" on public.cards
  for update using (public.is_self(user_id));

-- beneficiaries
drop policy if exists "benef_select_own" on public.beneficiaries;
create policy "benef_select_own" on public.beneficiaries
  for select using (public.is_self(user_id));

drop policy if exists "benef_insert_own" on public.beneficiaries;
create policy "benef_insert_own" on public.beneficiaries
  for insert with check (public.is_self(user_id));

drop policy if exists "benef_update_own" on public.beneficiaries;
create policy "benef_update_own" on public.beneficiaries
  for update using (public.is_self(user_id));

drop policy if exists "benef_delete_own" on public.beneficiaries;
create policy "benef_delete_own" on public.beneficiaries
  for delete using (public.is_self(user_id));

-- notifications
drop policy if exists "notif_select_own" on public.notifications;
create policy "notif_select_own" on public.notifications
  for select using (public.is_self(user_id));

drop policy if exists "notif_insert_own" on public.notifications;
create policy "notif_insert_own" on public.notifications
  for insert with check (public.is_self(user_id));

drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_own" on public.notifications
  for update using (public.is_self(user_id));

drop policy if exists "notif_delete_own" on public.notifications;
create policy "notif_delete_own" on public.notifications
  for delete using (public.is_self(user_id));

-- deposits / withdrawals
drop policy if exists "deposits_select_own" on public.deposits;
create policy "deposits_select_own" on public.deposits
  for select using (public.is_self(user_id));

drop policy if exists "deposits_insert_own" on public.deposits;
create policy "deposits_insert_own" on public.deposits
  for insert with check (public.is_self(user_id));

drop policy if exists "withdrawals_select_own" on public.withdrawals;
create policy "withdrawals_select_own" on public.withdrawals
  for select using (public.is_self(user_id));

drop policy if exists "withdrawals_insert_own" on public.withdrawals;
create policy "withdrawals_insert_own" on public.withdrawals
  for insert with check (public.is_self(user_id));

-- crypto assets
drop policy if exists "crypto_select_own" on public.crypto_assets;
create policy "crypto_select_own" on public.crypto_assets
  for select using (public.is_self(user_id));

drop policy if exists "crypto_insert_own" on public.crypto_assets;
create policy "crypto_insert_own" on public.crypto_assets
  for insert with check (public.is_self(user_id));

-- loans / grants
drop policy if exists "loans_select_own" on public.loans;
create policy "loans_select_own" on public.loans
  for select using (public.is_self(user_id));

drop policy if exists "loans_insert_own" on public.loans;
create policy "loans_insert_own" on public.loans
  for insert with check (public.is_self(user_id));

drop policy if exists "grants_select_own" on public.grants;
create policy "grants_select_own" on public.grants
  for select using (public.is_self(user_id));

drop policy if exists "grants_insert_own" on public.grants;
create policy "grants_insert_own" on public.grants
  for insert with check (public.is_self(user_id));

-- settings
drop policy if exists "settings_select_own" on public.settings;
create policy "settings_select_own" on public.settings
  for select using (public.is_self(user_id));

drop policy if exists "settings_update_own" on public.settings;
create policy "settings_update_own" on public.settings
  for update using (public.is_self(user_id));

-- card applications
drop policy if exists "cardapps_select_own" on public.card_applications;
create policy "cardapps_select_own" on public.card_applications
  for select using (public.is_self(user_id));

drop policy if exists "cardapps_insert_own" on public.card_applications;
create policy "cardapps_insert_own" on public.card_applications
  for insert with check (public.is_self(user_id));

-- sites: publicly readable.
drop policy if exists "sites_select_public" on public.sites;
create policy "sites_select_public" on public.sites
  for select using (true);

-- admin-only tables
drop policy if exists "admin_codes_admin" on public.admin_codes;
create policy "admin_codes_admin" on public.admin_codes
  for all using (public.is_admin());

drop policy if exists "twofa_admin" on public.twofa_codes;
create policy "twofa_admin" on public.twofa_codes
  for all using (public.is_admin());

alter table public.password_resets enable row level security;
drop policy if exists "password_resets_admin" on public.password_resets;
create policy "password_resets_admin" on public.password_resets
  for all using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed: default site + demo user (dev convenience)
-- ---------------------------------------------------------------------------
insert into public.sites (id, slug, name, brand_color)
values (1, 'account-dashboard', 'Account Dashboard', '#0ea5e9')
on conflict (id) do nothing;
