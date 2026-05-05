-- Force Supabase to refresh its schema cache for shop_settings table
-- This fixes the "user_email not found in schema cache" error
-- Run this in Supabase SQL Editor

-- Method 1: Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Method 2: If above doesn't work, make a trivial schema change to force refresh
-- Add a comment to the table (this forces PostgREST to reload)
COMMENT ON TABLE shop_settings IS 'Shop settings for multi-tenant system - schema refreshed';

-- Method 3: Verify the current columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;

-- You should see tenant_id in the list
-- If you don't see tenant_id, the column wasn't added properly
