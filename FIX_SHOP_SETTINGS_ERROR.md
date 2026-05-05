# Fix "user_email not found in schema cache" Error

## The Problem
You're getting this error when trying to edit Shop Settings:
```
could not find the 'user_email' of 'shop_settings' in the schema cache
```

This means the `shop_settings` table structure in your database doesn't match the API code. The API expects a multi-tenant structure with `tenant_id`, but your database might still have the old single-tenant structure.

## ✅ SOLUTION - Run This SQL

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy and Run This SQL

Copy the entire contents of this file:
```
lib/fix-shop-settings-complete.sql
```

Or copy this SQL directly:

```sql
-- Add tenant_id column if it doesn't exist
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

-- Add business_type column if missing
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

-- Migrate existing data - link settings to tenant
UPDATE shop_settings s
SET tenant_id = tu.tenant_id
FROM tenant_users tu
WHERE s.user_id = tu.user_id
AND s.tenant_id IS NULL;

-- Fallback: link by user's tenant_id
UPDATE shop_settings s
SET tenant_id = u.tenant_id
FROM users u
WHERE s.user_id = u.id
AND s.tenant_id IS NULL
AND u.tenant_id IS NOT NULL;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can insert own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can update own shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Users can delete own shop settings" ON shop_settings;

-- Create new tenant-based RLS policies
DROP POLICY IF EXISTS "Tenant users can view shop settings" ON shop_settings;
CREATE POLICY "Tenant users can view shop settings"
  ON shop_settings FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant users can insert shop settings" ON shop_settings;
CREATE POLICY "Tenant users can insert shop settings"
  ON shop_settings FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant users can update shop settings" ON shop_settings;
CREATE POLICY "Tenant users can update shop settings"
  ON shop_settings FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant users can delete shop settings" ON shop_settings;
CREATE POLICY "Tenant users can delete shop settings"
  ON shop_settings FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- Create index
CREATE INDEX IF NOT EXISTS idx_shop_settings_tenant_id ON shop_settings(tenant_id);

-- Remove duplicates
DELETE FROM shop_settings a 
USING shop_settings b
WHERE a.id < b.id AND a.tenant_id = b.tenant_id AND a.tenant_id IS NOT NULL;

-- Add unique constraint
ALTER TABLE shop_settings DROP CONSTRAINT IF EXISTS shop_settings_tenant_id_key;
ALTER TABLE shop_settings DROP CONSTRAINT IF EXISTS unique_tenant_settings;
ALTER TABLE shop_settings ADD CONSTRAINT unique_tenant_settings UNIQUE (tenant_id);

-- Verify
SELECT s.id, t.business_name as tenant, s.business_name as settings
FROM shop_settings s
LEFT JOIN tenants t ON s.tenant_id = t.id;
```

### Step 3: Click "Run" Button

You should see:
- "Success. No rows returned" (this is good!)
- Or a table showing your shop_settings with tenant names

### Step 4: Refresh Your Shop Settings Page

1. Go back to your Shop Settings page
2. Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac) to hard refresh
3. Try editing settings again

## ✅ What This Does

1. **Adds `tenant_id` column** - Links settings to tenants instead of users
2. **Migrates existing data** - Connects your current settings to the correct tenant
3. **Updates security policies** - Ensures tenant isolation
4. **Removes duplicates** - One setting per tenant
5. **Adds constraints** - Prevents future issues

## 🔍 Verify It Worked

After running the SQL, you should be able to:
- ✅ View Shop Settings page without errors
- ✅ Edit business name, logo, colors, etc.
- ✅ Save changes successfully
- ✅ See changes reflected in sidebar

## 🆘 If Still Not Working

1. **Check if SQL ran successfully**
   - Look for "Success" message in Supabase SQL Editor
   - No red error messages

2. **Verify tenant_id was added**
   Run this query:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'shop_settings';
   ```
   You should see `tenant_id` in the list.

3. **Check your settings have tenant_id**
   Run this query:
   ```sql
   SELECT id, tenant_id, business_name FROM shop_settings;
   ```
   All rows should have a `tenant_id` value (not NULL).

4. **Clear browser cache**
   - Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Or visit: https://smart-pos-system-peach.vercel.app/fix-prime-tech-cache.html

## 📝 Why This Happened

The system was upgraded from single-tenant to multi-tenant architecture. The API code was updated, but the database structure wasn't migrated. This SQL brings the database up to date with the code.

## 🎯 Prevention

All new tenants created after this fix will have the correct structure automatically. This is a one-time migration for existing data.
