-- ============================================================================
-- Admin expansion: audit trail, CRM tables, tickets, config, storage bucket
-- ============================================================================

-- ---------------------------------------------------------------- audit log
create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid,
  admin_email   text,
  action        text not null,
  target_type   text,
  target_id     text,
  target_label  text,
  details       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists audit_logs_created_idx
  on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_admin" on public.audit_logs;
create policy "audit_logs_admin" on public.audit_logs
  for all using (public.is_admin());

-- -------------------------------------------------------------------- leads
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  source     text default 'manual',
  status     text not null default 'new',
  notes      text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "leads_admin" on public.leads;
create policy "leads_admin" on public.leads
  for all using (public.is_admin());

-- ------------------------------------------------------------- admin tasks
create table if not exists public.admin_tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  assignee    text,
  priority    text not null default 'medium',
  status      text not null default 'pending',
  due_at      timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.admin_tasks enable row level security;

drop policy if exists "admin_tasks_admin" on public.admin_tasks;
create policy "admin_tasks_admin" on public.admin_tasks
  for all using (public.is_admin());

-- ------------------------------------------------------------ admin config
create table if not exists public.admin_config (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_config enable row level security;

drop policy if exists "admin_config_admin" on public.admin_config;
create policy "admin_config_admin" on public.admin_config
  for all using (public.is_admin());

-- --------------------------------------------------------- support tickets
create table if not exists public.support_tickets (
  id         text primary key,
  user_id    uuid references public.users(id) on delete cascade,
  subject    text not null,
  category   text default 'general',
  status     text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_user_idx
  on public.support_tickets(user_id);

alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets_admin" on public.support_tickets;
create policy "support_tickets_admin" on public.support_tickets
  for all using (public.is_admin());

create table if not exists public.support_messages (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  text references public.support_tickets(id) on delete cascade,
  sender     text not null default 'user',
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_ticket_idx
  on public.support_messages(ticket_id, created_at);

alter table public.support_messages enable row level security;

drop policy if exists "support_messages_admin" on public.support_messages;
create policy "support_messages_admin" on public.support_messages
  for all using (public.is_admin());

-- --------------------------------------------------------- contact inbox
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "contact_messages_admin" on public.contact_messages;
create policy "contact_messages_admin" on public.contact_messages
  for all using (public.is_admin());

-- ------------------------------------------------------------ irs refunds
create table if not exists public.irs_refunds (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  tax_year   int not null default 2025,
  amount     numeric(20,2) not null default 0,
  status     text not null default 'pending',
  notes      text,
  created_at timestamptz not null default now()
);

alter table public.irs_refunds enable row level security;

drop policy if exists "irs_refunds_admin" on public.irs_refunds;
create policy "irs_refunds_admin" on public.irs_refunds
  for all using (public.is_admin());

-- ------------------------------------------------------------- membership
create table if not exists public.memberships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  tier       text not null default 'standard',
  status     text not null default 'active',
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);

alter table public.memberships enable row level security;

drop policy if exists "memberships_admin" on public.memberships;
create policy "memberships_admin" on public.memberships
  for all using (public.is_admin());

-- -------------------------------------------------------------- currencies
create table if not exists public.site_currencies (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  symbol     text not null default '$',
  rate       numeric(20,8) not null default 1,
  enabled    boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.site_currencies (code, name, symbol)
values ('USD', 'US Dollar', '$'), ('EUR', 'Euro', '€'), ('GBP', 'British Pound', '£')
on conflict (code) do nothing;

alter table public.site_currencies enable row level security;

drop policy if exists "site_currencies_admin" on public.site_currencies;
create policy "site_currencies_admin" on public.site_currencies
  for all using (public.is_admin());
create policy "site_currencies_read_all" on public.site_currencies
  for select using (true);

-- ------------------------------------------- extend tx_kind with adjustment
alter type public.tx_kind add value if not exists 'adjustment' after 'grant';

-- ----------------------------------------------- avatars/uploads bucket
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

drop policy if exists "uploads_public_read" on storage.objects;
create policy "uploads_owner_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "uploads_user_write" on storage.objects;
create policy "uploads_user_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);