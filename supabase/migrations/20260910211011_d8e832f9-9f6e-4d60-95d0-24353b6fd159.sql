
-- Deposits: non-admin inserts must be pending
DROP POLICY IF EXISTS deposits_insert_own ON public.deposits;
CREATE POLICY deposits_insert_own ON public.deposits FOR INSERT TO authenticated
WITH CHECK (
  is_self(user_id) AND (public.is_admin() OR (status = 'pending'::req_status AND amount > 0))
);

-- Withdrawals: non-admin inserts must be pending and carry no confirmation code
DROP POLICY IF EXISTS withdrawals_insert_own ON public.withdrawals;
CREATE POLICY withdrawals_insert_own ON public.withdrawals FOR INSERT TO authenticated
WITH CHECK (
  is_self(user_id) AND (
    public.is_admin() OR (
      status = 'pending'::req_status
      AND amount > 0
      AND confirmation_code IS NULL
      AND confirmation_code_used_at IS NULL
      AND hold_settled_at IS NULL
    )
  )
);

-- Loans
DROP POLICY IF EXISTS loans_insert_own ON public.loans;
CREATE POLICY loans_insert_own ON public.loans FOR INSERT TO authenticated
WITH CHECK (
  is_self(user_id) AND (public.is_admin() OR (status = 'pending'::loan_status AND amount > 0))
);

-- Grants
DROP POLICY IF EXISTS grants_insert_own ON public.grants;
CREATE POLICY grants_insert_own ON public.grants FOR INSERT TO authenticated
WITH CHECK (
  is_self(user_id) AND (public.is_admin() OR status = 'pending'::grant_status)
);

-- Card applications
DROP POLICY IF EXISTS cardapps_insert_own ON public.card_applications;
CREATE POLICY cardapps_insert_own ON public.card_applications FOR INSERT TO authenticated
WITH CHECK (
  is_self(user_id) AND (public.is_admin() OR status = 'pending'::req_status)
);

-- Transactions: no client-side inserts at all; server (service_role) records history
DROP POLICY IF EXISTS tx_insert_own ON public.transactions;
REVOKE INSERT ON public.transactions FROM authenticated;
