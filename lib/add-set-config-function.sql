-- Add set_config function for tenant isolation
-- This function is required by the secureRoute middleware

-- Create the function if it doesn't exist
CREATE OR REPLACE FUNCTION set_config(
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_config(text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION set_config(text, text, boolean) TO service_role;
