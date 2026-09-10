DELETE FROM public.cards WHERE holder IN ('Card Holder','ALEX MORGAN') AND created_at > now() - interval '1 hour';
DELETE FROM public.card_applications WHERE created_at > now() - interval '1 hour';