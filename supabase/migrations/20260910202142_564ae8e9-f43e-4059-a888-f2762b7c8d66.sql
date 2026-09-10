UPDATE public.admin_config
SET value = (
  SELECT details FROM public.audit_logs
  WHERE target_id = 'live_chat' AND details ? 'welcome_message'
  ORDER BY created_at DESC LIMIT 1
), updated_at = now()
WHERE key = 'live_chat';