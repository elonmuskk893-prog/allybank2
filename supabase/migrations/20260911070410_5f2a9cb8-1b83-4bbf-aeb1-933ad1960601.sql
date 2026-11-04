-- Deposit payment methods: disabled by default pending operator review.
-- No customer funds are routed to third-party personal accounts by this
-- platform. Administrators may enable specific methods through the admin
-- panel after configuring their own settlement details.
INSERT INTO public.payment_methods (id, name, type, emoji, minimum, maximum, charges_amount, charges_type, duration, instructions, custom_fields, enabled, sort_order)
VALUES
  ('deposit_bank_usa', 'Bank Transfer — USA (USD)', 'deposit', '🏦', 100, 100000, 0, 'fixed', '1-5 business days',
   'Contact support for deposit instructions. Do not send funds to a personal account.',
   '[]'::jsonb, false, 1),
  ('deposit_bank_eur', 'Bank Transfer — Europe (EUR)', 'deposit', '🏦', 100, 100000, 0, 'fixed', '1-5 business days',
   'Contact support for deposit instructions. Do not send funds to a personal account.',
   '[]'::jsonb, false, 2),
  ('deposit_bank_gbp', 'Bank Transfer — UK (GBP)', 'deposit', '🏦', 100, 100000, 0, 'fixed', '1-5 business days',
   'Contact support for deposit instructions. Do not send funds to a personal account.',
   '[]'::jsonb, false, 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  minimum = EXCLUDED.minimum,
  maximum = EXCLUDED.maximum,
  charges_amount = EXCLUDED.charges_amount,
  duration = EXCLUDED.duration,
  instructions = EXCLUDED.instructions,
  custom_fields = EXCLUDED.custom_fields,
  enabled = false,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
