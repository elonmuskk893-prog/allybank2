CREATE OR REPLACE FUNCTION public.__migrate_export_auth()
RETURNS TABLE(kind text, row_json jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'user'::text, to_jsonb(u) FROM auth.users u
  UNION ALL
  SELECT 'identity'::text, to_jsonb(i) FROM auth.identities i
$$;
REVOKE ALL ON FUNCTION public.__migrate_export_auth() FROM PUBLIC, anon, authenticated;