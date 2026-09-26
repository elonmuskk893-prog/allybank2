DROP POLICY IF EXISTS "site_currencies_read_all" ON public.site_currencies;
CREATE POLICY "site_currencies_read_enabled"
ON public.site_currencies
FOR SELECT
TO anon, authenticated
USING (enabled = true OR public.is_admin());

DROP POLICY IF EXISTS "payment_methods_read_all" ON public.payment_methods;
CREATE POLICY "payment_methods_read_enabled"
ON public.payment_methods
FOR SELECT
TO anon, authenticated
USING (enabled = true OR public.is_admin());

DROP POLICY IF EXISTS "faqs_read_all" ON public.faqs;
CREATE POLICY "faqs_read_enabled"
ON public.faqs
FOR SELECT
TO anon, authenticated
USING (enabled = true OR public.is_admin());

DROP POLICY IF EXISTS "testimonials_read_all" ON public.testimonials;
CREATE POLICY "testimonials_read_enabled"
ON public.testimonials
FOR SELECT
TO anon, authenticated
USING (enabled = true OR public.is_admin());

DROP POLICY IF EXISTS "sites_select_public" ON public.sites;
CREATE POLICY "sites_select_active_site"
ON public.sites
FOR SELECT
TO anon, authenticated
USING (slug = 'teslamodel' OR public.is_admin());

DROP POLICY IF EXISTS "leads_insert_public" ON public.leads;
REVOKE INSERT ON public.leads FROM anon, authenticated;

DROP POLICY IF EXISTS "contact_messages_insert_public" ON public.contact_messages;
REVOKE INSERT ON public.contact_messages FROM anon, authenticated;