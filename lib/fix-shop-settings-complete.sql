-- COMPLETE FIX for shop_settings table structure
-- This ensures the table matches the multi-tenant API code
-- Run this in Supabase SQL Editor

-- Step 1: Check current structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;

-- Step 2: Add tenant_id column if it doesn't exist
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

-- Step 3: Add business_type column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_settings' AND column_name = 'business_type'
  ) THEN
    ALTER TABLE shop_settings 
    ADD COLUMN business_type VARCHAR(100);
  END IF;
END $$;

-- Step 4: Migrate existing data - link settings to tenant based on user
-- This handles settings that have user_id but no tenant_id
UPDATE shop_settings s
SET tenant_id = tu.tenant_id
FROM tenant_users tu
WHERE s.user_id = tu.user_id
AND s.tenant_id IS NULL;

-- Step 5: For settings without tenant_id, try to match by user in users table
UPDATE shop_settings s
SET tenant_id = u.tenant_id
FROM users u
WHERE s.user_id = u.id
AND s.tenant_id IS NULL
AND u.tenant_id IS NOT NULL;

-- Step 6: Check for any orphaned settings (no tenant_id)
SELECT 
  s.id,
  s.user_id,
  s.business_name,
  u.email as user_email,
  'NEEDS MANUAL FIX' as status
FROM shop_settings s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.tenant_id IS NULL;

-- Step 7: Drop old RLS policies (if they exist)
DROP POLICY IF EXISTS "Users can view own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can insert own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can update own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can delete own shop settings" ON shop_settings;

-- Step 8: Create new tenant-based RLS policies
DO $$ 
BEGIN
  -- Drop if exists, then create
  DROP POLICY IF EXISTS "Tenant users can view shop settings" ON shop_settings;
  CREATE POLICY "Tenant users can view shop settings"
    ON shop_settings
    FOR SELECT
    USING (
      tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Tenant users can insert shop settings" ON shop_settings;
  CREATE POLICY "Tenant users can insert shop settings"
    ON shop_settings
    FOR INSERT
    WITH CHECK (
      tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Tenant users can update shop settings" ON shop_settings;
  CREATE POLICY "Tenant users can update shop settings"
    ON shop_settings
    FOR UPDATE
    USING (
      tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Tenant users can delete shop settings" ON shop_settings;
  CREATE POLICY "Tenant users can delete shop settings"
    ON shop_settings
    FOR DELETE
    USING (
      tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
      )
    );
END $$;

-- Step 9: Create index for tenant_id (if not exists)
CREATE INDEX IF NOT EXISTS idx_shop_settings_tenant_id ON shop_settings(tenant_id);

-- Step 10: Remove duplicate settings per tenant (keep the most recent)
DELETE FROM shop_settings a 
USING shop_settings b
WHERE a.id < b.id 
AND a.tenant_id = b.tenant_id
AND a.tenant_id IS NOT NULL;

-- Step 11: Add unique constraint for one setting per tenant
ALTER TABLE shop_settings DROP CONSTRAINT IF EXISTS shop_settings_tenant_id_key;
ALTER TABLE shop_settings DROP CONSTRAINT IF EXISTS unique_tenant_settings;
ALTER TABLE shop_settings ADD CONSTRAINT unique_tenant_settings UNIQUE (tenant_id);

-- Step 12: Remove old user_id unique constraint if it exists
ALTER TABLE shop_settings DROP CONSTRAINT IF EXISTS shop_settings_user_id_key;

-- Step 13: Verify the final structure
SELECT 
  s.id,
  s.tenant_id,
  t.business_name as tenant_name,
  t.slug as tenant_slug,
  s.business_name as settings_name,
  s.business_type,
  s.user_id,
  u.email as user_email,
  s.created_at
FROM shop_settings s
LEFT JOIN tenants t ON s.tenant_id = t.id
LEFT JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;

-- Step 14: Show final column structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;
