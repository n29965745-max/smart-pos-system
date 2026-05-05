-- ============================================================
-- ENABLE SESSION VARIABLE FOR RLS
-- Run this in Supabase SQL Editor
-- ============================================================

-- The built-in set_config() already exists in PostgreSQL.
-- We just need to grant the API access to call it via RPC.
-- This wrapper exposes it as a callable RPC function.

CREATE OR REPLACE FUNCTION public.set_config(
  setting_name TEXT,
  new_value TEXT,
  is_local BOOLEAN DEFAULT false
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT set_config(setting_name, new_value, is_local);
$$;

-- Grant execute to all roles the API might use
GRANT EXECUTE ON FUNCTION public.set_config(TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_config(TEXT, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION public.set_config(TEXT, TEXT, BOOLEAN) TO service_role;

-- Verify it was created
SELECT proname, pronamespace::regnamespace AS schema
FROM pg_proc
WHERE proname = 'set_config'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
