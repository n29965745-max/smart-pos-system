-- COMPLETE FIX for "user_email not found in schema cache" error
-- This error means Supabase PostgREST hasn't refreshed its schema cache
-- Run this ENTIRE script in Supabase SQL Editor

-- ============================================
-- STEP 1: Diagnose the current state
-- ============================================

-- Check if shop_settings table exists
SELECT 
  'shop_settings table exists' as status,
  COUNT(*) as record_count
FROM shop_settings;

-- Check current columns in shop_settings
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;

-- Check for orphaned records (no tenant_id)
SELECT 
  COUNT(*) as orphaned_count,
  'Records without tenant_id' as description
FROM shop_settings
WHERE tenant_id IS NULL;

-- ============================================
-- STEP 2: Add missing columns if needed
-- ============================================

-- Add tenant_id column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_settings' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE shop_settings 
    ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added tenant_id column';
  ELSE
    RAISE NOTICE 'tenant_id column already exists';
  END IF;
END $$;

-- Add user_id column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_settings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE shop_settings 
    ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added user_id column';
  ELSE
    RAISE NOTICE 'user_id column already exists';
  END IF;
END $$;

-- ============================================
-- STEP 3: Migrate existing data
-- ============================================

-- Link settings to tenants via tenant_users
UPDATE shop_settings s
SET tenant_id = tu.tenant_id
FROM tenant_users tu
WHERE s.user_id = tu.user_id
AND s.tenant_id IS NULL;

-- Link settings to tenants via users table
UPDATE shop_settings s
SET tenant_id = u.tenant_id
FROM users u
WHERE s.user_id = u.id
AND s.tenant_id IS NULL
AND u.tenant_id IS NOT NULL;

-- ============================================
-- STEP 4: Delete orphaned records
-- ============================================

-- Show orphaned records before deletion
SELECT 
  id,
  business_name,
  user_id,
  'WILL BE DELETED' as status
FROM shop_settings
WHERE tenant_id IS NULL;

-- Delete orphaned records (records with no tenant)
DELETE FROM shop_settings
WHERE tenant_id IS NULL;

-- ============================================
-- STEP 5: Update RLS policies
-- ============================================

-- Enable RLS if not enabled
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Drop all old policies
DROP POLICY IF EXISTS "Users can view own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can insert own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can update own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can delete own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Tenant users can view shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Tenant users can insert shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Tenant users can update shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Tenant users can delete shop settings" ON shop_settings;

-- Create new tenant-based policies
CREATE POLICY "Tenant users can view shop settings"
  ON shop_settings
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can insert shop settings"
  ON shop_settings
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can update shop settings"
  ON shop_settings
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can delete shop settings"
  ON shop_settings
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 6: Add constraints and indexes
-- ============================================

-- Create index for tenant_id
CREATE INDEX IF NOT EXISTS idx_shop_settings_tenant_id ON shop_settings(tenant_id);

-- Remove duplicates (keep most recent per tenant)
DELETE FROM shop_settings a 
USING shop_settings b
WHERE a.id < b.id 
AND a.tenant_id = b.tenant_id
AND a.tenant_id IS NOT NULL;

-- Add unique constraint (one setting per tenant)
ALTER TABLE shop_settings DROP CONSTRAINT IF EXISTS shop_settings_tenant_id_key;
ALTER TABLE shop_settings DROP CONSTRAINT IF EXISTS unique_tenant_settings;
ALTER TABLE shop_settings ADD CONSTRAINT unique_tenant_settings UNIQUE (tenant_id);

-- Remove old user_id unique constraint
ALTER TABLE shop_settings DROP CONSTRAINT IF EXISTS shop_settings_user_id_key;

-- ============================================
-- STEP 7: FORCE SCHEMA CACHE REFRESH
-- ============================================

-- Method 1: Notify PostgREST to reload
NOTIFY pgrst, 'reload schema';

-- Method 2: Add comment to force refresh
COMMENT ON TABLE shop_settings IS 'Multi-tenant shop settings - schema refreshed';

-- ============================================
-- STEP 8: Verify the fix
-- ============================================

-- Show final table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;

-- Show all shop_settings with tenant info
SELECT 
  s.id,
  s.tenant_id,
  t.business_name as tenant_name,
  t.slug as tenant_slug,
  s.business_name as settings_business_name,
  s.business_type,
  s.user_id,
  u.email as user_email,
  s.created_at,
  s.updated_at
FROM shop_settings s
LEFT JOIN tenants t ON s.tenant_id = t.id
LEFT JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;

-- Check for any remaining issues
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned records'
    ELSE '❌ Still have orphaned records: ' || COUNT(*)::TEXT
  END as orphan_check
FROM shop_settings
WHERE tenant_id IS NULL;

-- Show RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'shop_settings';

-- ============================================
-- FINAL MESSAGE
-- ============================================

SELECT 
  '✅ COMPLETE! Schema cache should be refreshed.' as status,
  'If error persists, wait 30 seconds and try again.' as note,
  'PostgREST may need a moment to reload the schema.' as explanation;
