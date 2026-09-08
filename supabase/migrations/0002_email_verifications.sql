-- ============================================================================
-- Email verification codes (SMTP-delivered) — supplement to 0001_initial_schema
-- ============================================================================

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