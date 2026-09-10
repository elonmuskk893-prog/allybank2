REVOKE ALL ON FUNCTION public.credit_account(uuid, numeric, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_account(uuid, numeric, text) TO service_role;

REVOKE ALL ON FUNCTION public.debit_account(uuid, numeric, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.debit_account(uuid, numeric, text) TO service_role;

REVOKE ALL ON FUNCTION public.release_hold(uuid, numeric, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_hold(uuid, numeric, text) TO service_role;

REVOKE ALL ON FUNCTION public.settle_hold(uuid, numeric, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_hold(uuid, numeric, text) TO service_role;

REVOKE ALL ON FUNCTION public.record_transaction(uuid, uuid, public.tx_kind, public.tx_direction, numeric, text, text, text, public.tx_status, numeric, numeric) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_transaction(uuid, uuid, public.tx_kind, public.tx_direction, numeric, text, text, text, public.tx_status, numeric, numeric) TO service_role;

REVOKE ALL ON FUNCTION public.generate_account_number() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_account_number() TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;