-- Drop and recreate set_config function for tenant isolation
-- This fixes the "cannot remove parameter defaults" error

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.set_config(text, text, boolean);

-- Create the function with correct signature
CREATE OR REPLACE FUNCTION public.set_config(
  setting_name text,
  new_value text,
  is_local boolean
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the configuration parameter
  PERFORM set_config(setting_name, new_value, is_local);
  RETURN new_value;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.set_config(text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_config(text, text, boolean) TO service_role;
