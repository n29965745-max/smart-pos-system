-- SIMPLEST FIX for shop settings user_email error
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- 1. Remove user_email column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_settings' AND column_name = 'user_email'
  ) THEN
    ALTER TABLE shop_settings DROP COLUMN user_email;
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
  END IF;
END $$;

-- 4. Delete orphaned records
DELETE FROM shop_settings WHERE tenant_id IS NULL;

-- 5. Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- 6. Update table comment
COMMENT ON TABLE shop_settings IS 'Multi-tenant shop settings';

-- Done! Wait 30 seconds then test Shop Settings page
SELECT '✅ Complete! Wait 30 seconds for cache refresh.' as status;
