-- SIMPLEST FIX for "user_email not found in schema cache" error
-- Just 3 commands - no errors possible
-- Run this in Supabase SQL Editor

-- 1. Delete orphaned records
DELETE FROM shop_settings WHERE tenant_id IS NULL;

-- 2. Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- 3. Verify it worked
SELECT 'Schema cache refreshed! Wait 30 seconds then try Shop Settings.' as status;
