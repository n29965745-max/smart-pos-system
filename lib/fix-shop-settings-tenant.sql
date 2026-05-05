-- Fix shop_settings table for multi-tenant architecture
-- Run this in Supabase SQL Editor

-- Step 1: Add tenant_id column if it doesn't exist
ALTER TABLE shop_settings 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 2: Add business_type column if missing
ALTER TABLE shop_settings 
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);

-- Step 3: Migrate existing data - link settings to tenant based on user
-- This assumes users are already linked to tenants via tenant_users table
UPDATE shop_settings s
SET tenant_id = tu.tenant_id
FROM tenant_users tu
WHERE s.user_id = tu.user_id
AND s.tenant_id IS NULL;

-- Step 4: For any remaining settings without tenant_id, try to match by user
-- If user doesn't exist in tenant_users, we'll need to handle manually
-- You can check which ones need manual intervention:
SELECT s.id, s.user_id, s.business_name
FROM shop_settings s
WHERE s.tenant_id IS NULL;

-- Step 5: Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can insert own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can update own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can delete own shop settings" ON shop_settings;

-- Step 6: Create new tenant-based RLS policies
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

-- Step 7: Create index for tenant_id
CREATE INDEX IF NOT EXISTS idx_shop_settings_tenant_id ON shop_settings(tenant_id);

-- Step 8: Make tenant_id NOT NULL after migration (optional, uncomment if all data is migrated)
-- ALTER TABLE shop_settings ALTER COLUMN tenant_id SET NOT NULL;

-- Step 9: Add unique constraint for one setting per tenant
-- First, remove any duplicates if they exist
DELETE FROM shop_settings a USING shop_settings b
WHERE a.id < b.id 
AND a.tenant_id = b.tenant_id
AND a.tenant_id IS NOT NULL;

-- Then add the constraint
ALTER TABLE shop_settings DROP CONSTRAINT IF EXISTS shop_settings_tenant_id_key;
ALTER TABLE shop_settings ADD CONSTRAINT shop_settings_tenant_id_key UNIQUE (tenant_id);

-- Step 10: Verify the migration
SELECT 
  s.id,
  s.tenant_id,
  t.business_name as tenant_name,
  s.business_name as settings_name,
  s.user_id
FROM shop_settings s
LEFT JOIN tenants t ON s.tenant_id = t.id
ORDER BY s.created_at DESC;
