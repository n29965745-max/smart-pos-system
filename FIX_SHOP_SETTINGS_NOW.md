# Fix Shop Settings Error - "user_email not found"

## Problem
The error `could not find the 'user_email' of 'shop_setting' in the schema cache` occurs because the `shop_settings` table structure is outdated. The system has moved to multi-tenant architecture but the database table hasn't been updated.

## Solution

### Step 1: Run the Migration SQL

Go to your **Supabase SQL Editor** and run this file:
```
lib/fix-shop-settings-tenant.sql
```

Or copy and paste this SQL directly:

```sql
-- Add tenant_id column
ALTER TABLE shop_settings 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add business_type column
ALTER TABLE shop_settings 
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);

-- Migrate existing data - link settings to tenant
UPDATE shop_settings s
SET tenant_id = tu.tenant_id
FROM tenant_users tu
WHERE s.user_id = tu.user_id
AND s.tenant_id IS NULL;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can insert own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can update own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can delete own shop settings" ON shop_settings;

-- Create new tenant-based RLS policies
CREATE POLICY "Tenant users can view shop settings"
  ON shop_settings FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can insert shop settings"
  ON shop_settings FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can update shop settings"
  ON shop_settings FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can delete shop settings"
  ON shop_settings FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- Create index
CREATE INDEX IF NOT EXISTS idx_shop_settings_tenant_id ON shop_settings(tenant_id);

-- Remove duplicates
DELETE FROM shop_settings a USING shop_settings b
WHERE a.id < b.id AND a.tenant_id = b.tenant_id AND a.tenant_id IS NOT NULL;

-- Add unique constraint
ALTER TABLE shop_settings DROP CONSTRAINT IF EXISTS shop_settings_tenant_id_key;
ALTER TABLE shop_settings ADD CONSTRAINT shop_settings_tenant_id_key UNIQUE (tenant_id);
```

### Step 2: Verify the Migration

Run this query to check if the migration worked:

```sql
SELECT 
  s.id,
  s.tenant_id,
  t.business_name as tenant_name,
  s.business_name as settings_name
FROM shop_settings s
LEFT JOIN tenants t ON s.tenant_id = t.id;
```

You should see:
- Each shop_settings row has a `tenant_id`
- The `tenant_name` matches your tenant's business name

### Step 3: Test Shop Settings

1. Log in to your admin panel
2. Go to **Shop Settings** page
3. Try updating any field (business name, logo URL, etc.)
4. Click "Save Settings"
5. Should save successfully without errors

## What This Migration Does

1. ✅ Adds `tenant_id` column to `shop_settings` table
2. ✅ Links existing settings to tenants via `tenant_users` table
3. ✅ Updates RLS policies to use tenant-based access control
4. ✅ Removes duplicate settings per tenant
5. ✅ Adds unique constraint (one setting per tenant)

## If You Still Get Errors

### Error: "tenant_id cannot be null"
This means some shop_settings rows couldn't be linked to a tenant. Run:

```sql
-- Check orphaned settings
SELECT * FROM shop_settings WHERE tenant_id IS NULL;

-- Option 1: Delete orphaned settings
DELETE FROM shop_settings WHERE tenant_id IS NULL;

-- Option 2: Manually link to a tenant
UPDATE shop_settings 
SET tenant_id = 'YOUR_TENANT_ID_HERE'
WHERE tenant_id IS NULL;
```

### Error: "relation shop_settings does not exist"
The table doesn't exist. Create it first:

```sql
CREATE TABLE shop_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID,
  business_name VARCHAR(255) NOT NULL DEFAULT 'My Shop',
  business_tagline VARCHAR(255),
  business_type VARCHAR(100),
  business_email VARCHAR(255),
  business_phone VARCHAR(50),
  business_address TEXT,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#10b981',
  secondary_color VARCHAR(7),
  currency VARCHAR(10) DEFAULT 'KES',
  currency_symbol VARCHAR(5) DEFAULT 'KSh',
  timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
  tiktok_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id)
);

ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
```

Then run the migration SQL from Step 1.

## After Migration

Your Shop Settings page should now work correctly:
- ✅ Load settings for your tenant
- ✅ Save changes without errors
- ✅ Show shop URL with slug
- ✅ Display logo preview
- ✅ Update social media links

The error "user_email not found" will be gone!
