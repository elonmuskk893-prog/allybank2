create table if not exists public.email_verifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  email      text not null,
  code_hash  text not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_verifications_user_idx
  on public.email_verifications(user_id, created_at desc);

create index if not exists email_verifications_email_idx
  on public.email_verifications(email, created_at desc);

alter table public.email_verifications enable row level security;

drop policy if exists "email_verifications_admin" on public.email_verifications;
create policy "email_verifications_admin" on public.email_verifications
  for all using (public.is_admin());

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

create table if not exists public.admin_config (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_config enable row level security;

drop policy if exists "admin_config_admin" on public.admin_config;
create policy "admin_config_admin" on public.admin_config
  for all using (public.is_admin());

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
drop policy if exists "site_currencies_read_all" on public.site_currencies;
create policy "site_currencies_read_all" on public.site_currencies
  for select using (true);

alter type public.tx_kind add value if not exists 'adjustment' after 'grant';

alter table public.withdrawals
  add column if not exists confirmation_code text;
alter table public.withdrawals
  add column if not exists confirmation_code_generated_at timestamptz;
alter table public.withdrawals
  add column if not exists confirmation_code_expires_at timestamptz;
alter table public.withdrawals
  add column if not exists confirmation_code_used_at timestamptz;

create index if not exists withdrawals_confirmation_code_idx
  on public.withdrawals(confirmation_code);

create table if not exists public.payment_methods (
  id             text primary key,
  name           text not null,
  type           text not null,
  emoji          text not null default '',
  minimum        numeric(20,2) not null default 0,
  maximum        numeric(20,2) not null default 0,
  charges_amount numeric(20,2) not null default 0,
  charges_type   text,
  duration       text,
  instructions   text,
  custom_fields  jsonb not null default '[]'::jsonb,
  enabled        boolean not null default true,
  sort_order     int not null default 100,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

drop policy if exists "payment_methods_admin" on public.payment_methods;
create policy "payment_methods_admin" on public.payment_methods
  for all using (public.is_admin());
drop policy if exists "payment_methods_read_all" on public.payment_methods;
create policy "payment_methods_read_all" on public.payment_methods
  for select using (true);

create table if not exists public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  sort_order int not null default 100,
  enabled    boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.faqs (question, answer, sort_order)
values
  ('How do I open an account?', 'Click Sign Up, fill in your details and verify your email address. Your account is ready instantly.', 10),
  ('How long does a withdrawal take?', 'Withdrawals are reviewed by our team and typically settle within 1-2 business days depending on the destination.', 20),
  ('How do I verify my identity?', 'Go to Settings → Verification and submit a government-issued ID. Reviews are usually completed within 24 hours.', 30),
  ('Are there any fees?', 'Fees, when they apply, are shown before you confirm any transaction.', 40)
on conflict do nothing;

alter table public.faqs enable row level security;

drop policy if exists "faqs_admin" on public.faqs;
create policy "faqs_admin" on public.faqs
  for all using (public.is_admin());
drop policy if exists "faqs_read_all" on public.faqs;
create policy "faqs_read_all" on public.faqs
  for select using (true);

create table if not exists public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  author     text not null,
  role       text,
  quote      text not null,
  rating     int not null default 5,
  enabled    boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

drop policy if exists "testimonials_admin" on public.testimonials;
create policy "testimonials_admin" on public.testimonials
  for all using (public.is_admin());
drop policy if exists "testimonials_read_all" on public.testimonials;
create policy "testimonials_read_all" on public.testimonials
  for select using (true);

alter table public.transactions
  add column if not exists confirmation_code text;
alter table public.transactions
  add column if not exists confirmation_code_generated_at timestamptz;
alter table public.transactions
  add column if not exists confirmation_code_expires_at timestamptz;
alter table public.transactions
  add column if not exists confirmation_code_used_at timestamptz;

create index if not exists transactions_confirmation_code_idx
  on public.transactions(confirmation_code);
