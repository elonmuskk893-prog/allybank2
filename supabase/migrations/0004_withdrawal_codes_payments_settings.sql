-- ============================================================================
-- Withdrawal confirmation codes + DB-driven payment methods
-- ============================================================================

-- ------------------------------------------------- withdrawal confirmation
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

-- ------------------------------------------------------ payment methods
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
create policy "payment_methods_read_all" on public.payment_methods
  for select using (true);

-- ------------------------------------------------------------- site FAQ
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
  ('How do I open an account?', 'Click Sign Up, fill in your details and verify your email address. Your account is ready after verification.', 10),
  ('How long does a withdrawal take?', 'Withdrawals are reviewed before processing. The estimated timing for your selected method is shown before you submit the request.', 20),
  ('How do I verify my identity?', 'Go to Settings → Verification and submit a government-issued ID. Review times vary.', 30),
  ('Are there any fees?', 'Fees, when they apply, are shown before you confirm any transaction.', 40)
on conflict do nothing;

alter table public.faqs enable row level security;

drop policy if exists "faqs_admin" on public.faqs;
create policy "faqs_admin" on public.faqs
  for all using (public.is_admin());
create policy "faqs_read_all" on public.faqs
  for select using (true);

-- ------------------------------------------------------- testimonials
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
create policy "testimonials_read_all" on public.testimonials
  for select using (true);