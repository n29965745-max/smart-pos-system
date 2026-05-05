-- QUICK FIX for shop settings user_email error
-- Run this in Supabase SQL Editor

-- 1. Remove user_email column if it exists (not needed by API)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_settings' AND column_name = 'user_email'
  ) THEN
    ALTER TABLE shop_settings DROP COLUMN user_email;
    RAISE NOTICE '✅ Removed user_email column';
  ELSE
    RAISE NOTICE 'ℹ️ user_email column does not exist';
  END IF;
END $$;

-- 2. Ensure tenant_id exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_settings' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE shop_settings 
    ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added tenant_id column';
  ELSE
    RAISE NOTICE 'ℹ️ tenant_id column already exists';
  END IF;
END $$;

-- 3. Ensure user_id exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_settings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE shop_settings 
    ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added user_id column';
  ELSE
    RAISE NOTICE 'ℹ️ user_id column already exists';
  END IF;
END $$;

-- 4. Delete orphaned records (no tenant_id)
DELETE FROM shop_settings WHERE tenant_id IS NULL;

-- 5. Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- 6. Update table comment to trigger refresh
COMMENT ON TABLE shop_settings IS 'Multi-tenant shop settings';

-- 7. Show final structure
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;

-- 9. Show current data
SELECT 
  s.id,
  s.tenant_id,
  t.business_name as tenant_name,
  s.business_name as settings_name,
  s.user_id
FROM shop_settings s
LEFT JOIN tenants t ON s.tenant_id = t.id
ORDER BY s.created_at DESC;

-- Done!
SELECT '✅ Schema cache refresh complete!' as status;
