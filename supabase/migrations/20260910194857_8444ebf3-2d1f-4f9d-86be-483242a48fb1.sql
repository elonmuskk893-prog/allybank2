CREATE TABLE public.grant_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'fa-solid fa-hand-holding-dollar',
  tint text NOT NULL DEFAULT 'blue',
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_amount numeric,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.grant_programs TO anon;
GRANT SELECT ON public.grant_programs TO authenticated;
GRANT ALL ON public.grant_programs TO service_role;

ALTER TABLE public.grant_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled grant programs"
  ON public.grant_programs FOR SELECT
  USING (enabled = true OR public.is_admin());

CREATE POLICY "Admins manage grant programs"
  ON public.grant_programs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER grant_programs_updated_at
  BEFORE UPDATE ON public.grant_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
