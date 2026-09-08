-- ============================================================================
-- Transfer confirmation codes (on the transactions table)
-- ============================================================================

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