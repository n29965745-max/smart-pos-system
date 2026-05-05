-- Fix "user_email not found in schema cache" error
-- This script ensures the shop_settings table has the correct structure
-- and forces PostgREST to refresh its schema cache

-- ============================================
-- STEP 1: Verify table structure
-- ============================================

-- Check current columns
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;

-- ============================================
-- STEP 2: Ensure required columns exist
-- ============================================

-- Add tenant_id if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_settings' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE shop_settings 
    ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added tenant_id column';
  END IF;
END $$;

-- Add user_id if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_settings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE shop_settings 
    ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added user_id column';
  END IF;
END $$;

-- ============================================
-- STEP 3: Remove user_email column if it exists
-- ============================================

-- The API doesn't use user_email, it uses user_id from authentication
-- If user_email column exists, it can cause schema cache confusion
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_settings' AND column_name = 'user_email'
  ) THEN
    ALTER TABLE shop_settings DROP COLUMN user_email;
    RAISE NOTICE 'Removed user_email column (not needed)';
  END IF;
END $$;

-- ============================================
-- STEP 4: Clean up orphaned records
-- ============================================

-- Delete records without tenant_id
DELETE FROM shop_settings
WHERE tenant_id IS NULL;

-- ============================================
-- STEP 5: Update RLS policies
-- ============================================

-- Enable RLS
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can insert own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can update own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can delete own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Tenant users can view shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Tenant users can insert shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Tenant users can update shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Tenant users can delete shop settings" ON shop_settings;

-- Create tenant-based policies
CREATE POLICY "Tenant users can view shop settings"
  ON shop_settings FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can insert shop settings"
  ON shop_settings FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can update shop settings"
  ON shop_settings FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can delete shop settings"
  ON shop_settings FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 6: Add indexes and constraints
-- ============================================

-- Create index for tenant_id
CREATE INDEX IF NOT EXISTS idx_shop_settings_tenant_id ON shop_settings(tenant_id);

-- Ensure one setting per tenant
ALTER TABLE shop_settings DROP CONSTRAINT IF EXISTS shop_settings_tenant_id_key;
ALTER TABLE shop_settings DROP CONSTRAINT IF EXISTS unique_tenant_settings;
ALTER TABLE shop_settings ADD CONSTRAINT unique_tenant_settings UNIQUE (tenant_id);

-- ============================================
-- STEP 7: FORCE SCHEMA CACHE REFRESH
-- ============================================

-- Method 1: Notify PostgREST
NOTIFY pgrst, 'reload schema';

-- Method 2: Update table comment
DO $$
BEGIN
  EXECUTE 'COMMENT ON TABLE shop_settings IS ''Multi-tenant shop settings - updated ' || NOW()::TEXT || '''';
END $$;

-- Method 3: Vacuum analyze
VACUUM ANALYZE shop_settings;

-- ============================================
-- STEP 8: Verify the fix
-- ============================================

-- Show final structure
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;

-- Show all settings with tenant info
SELECT 
  s.id,
  s.tenant_id,
  t.business_name as tenant_name,
  t.slug,
  s.business_name as settings_name,
  s.user_id,
  s.created_at
FROM shop_settings s
LEFT JOIN tenants t ON s.tenant_id = t.id
ORDER BY s.created_at DESC;

-- Check RLS policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'shop_settings';

-- Final status
SELECT 
  '✅ Schema cache refresh complete!' as status,
  'Wait 30 seconds then test Shop Settings page' as next_step;
