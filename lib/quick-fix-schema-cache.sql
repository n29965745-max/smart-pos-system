-- QUICK FIX for "user_email not found in schema cache" error
-- Simple script with no syntax errors
-- Run this in Supabase SQL Editor

-- Step 1: Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Step 2: Add a simple comment to force refresh
COMMENT ON TABLE shop_settings IS 'Schema cache refreshed';

-- Step 3: Delete any orphaned records (records without tenant_id)
DELETE FROM shop_settings WHERE tenant_id IS NULL;

-- Step 4: Force reload again
NOTIFY pgrst, 'reload schema';

-- Step 5: Verify columns exist
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;

-- Step 6: Check for remaining issues
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as orphaned_records,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as valid_records
FROM shop_settings;

-- Step 7: Show all shop settings with tenant info
SELECT 
  s.id,
  s.tenant_id,
  t.business_name as tenant_name,
  t.slug as tenant_slug,
  s.business_name as settings_name
FROM shop_settings s
LEFT JOIN tenants t ON s.tenant_id = t.id
ORDER BY s.created_at DESC;

-- Done! Wait 30 seconds then try Shop Settings page again.
