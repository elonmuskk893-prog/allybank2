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

INSERT INTO public.grant_programs (title, description, icon, tint, bullets, max_amount, sort_order) VALUES
('Small Business Grant', 'Up to $50,000 in funding for small business startups and expansion projects.', 'fa-solid fa-store', 'blue', '["No collateral required","Flexible repayment terms","Business mentorship included"]'::jsonb, 50000, 1),
('Education Grant', 'Financial assistance for higher education, vocational training, and skill development.', 'fa-solid fa-graduation-cap', 'purple', '["Up to $25,000 per year","Merit-based selection","Career guidance support"]'::jsonb, 25000, 2),
('Home Ownership Grant', 'Down payment assistance and closing cost support for first-time homebuyers.', 'fa-solid fa-home', 'green', '["Up to $15,000 assistance","First-time buyer priority","Homebuyer education"]'::jsonb, 15000, 3),
('Emergency Relief Grant', 'Immediate financial assistance for unexpected emergencies and hardships.', 'fa-solid fa-heart', 'red', '["Quick approval process","Up to $10,000 immediate","24/7 application support"]'::jsonb, 10000, 4),
('Community Development', 'Support for community projects, non-profits, and local development initiatives.', 'fa-solid fa-users', 'orange', '["Up to $100,000 funding","Community impact focus","Ongoing project support"]'::jsonb, 100000, 5),
('Healthcare Grant', 'Medical expense assistance and healthcare accessibility support programs.', 'fa-solid fa-stethoscope', 'teal', '["Medical bill assistance","Prescription drug support","Health insurance help"]'::jsonb, NULL, 6);