
alter function public.users_self_update_allowed(uuid, public.user_role, public.user_status, public.kyc_status, boolean, text, text, text, boolean, boolean) security invoker;
alter function public.accounts_self_update_allowed(uuid, numeric, numeric, public.account_status, text, uuid) security invoker;
alter function public.cards_self_update_allowed(uuid, numeric, numeric, public.card_status, uuid) security invoker;
alter function public.settings_self_update_allowed(uuid, jsonb) security invoker;
