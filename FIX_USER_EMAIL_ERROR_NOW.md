# 🔧 Fix "user_email not found in schema cache" Error

## ⚡ QUICK FIX - Run This SQL

### Error Message:
```
could not find the 'user_email' of 'shop_settings' in the schema cache
```

### What This Means:
Supabase's PostgREST schema cache is outdated. It doesn't know about the current structure of the `shop_settings` table.

---

## 🎯 SOLUTION - Run This SQL Script

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Run This Script

Open the file: **`lib/fix-user-email-error-complete.sql`**

Or run this shorter version:

```sql
-- Quick fix for schema cache error

-- 1. Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- 2. Add comment to force PostgREST reload
COMMENT ON TABLE shop_settings IS 'Schema refreshed at ' || NOW()::TEXT;

-- 3. Vacuum analyze
VACUUM ANALYZE shop_settings;

-- 4. Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;

-- 5. Check for orphaned records
SELECT COUNT(*) as orphaned_records
FROM shop_settings
WHERE tenant_id IS NULL;

-- 6. Delete orphaned records if any
DELETE FROM shop_settings
WHERE tenant_id IS NULL;

-- 7. Final refresh
NOTIFY pgrst, 'reload schema';
```

### Step 3: Wait 30 Seconds
After running the SQL, wait 30 seconds for PostgREST to reload the schema cache.

### Step 4: Test Shop Settings
1. Go to **Shop Settings** page
2. Try to edit and save settings
3. Error should be gone ✅

---

## 🔍 Why This Happens

The error occurs when:
1. Database table structure changes (columns added/removed)
2. Supabase's PostgREST cache doesn't know about the changes
3. API tries to query columns that PostgREST thinks don't exist

**Solution:** Force PostgREST to reload its schema cache.

---

## 📋 Alternative Methods

### Method 1: Restart PostgREST (Automatic)
Supabase automatically restarts PostgREST every few minutes. Just wait 2-3 minutes and try again.

### Method 2: Make a Schema Change
Any schema change forces a reload:
```sql
COMMENT ON TABLE shop_settings IS 'Force reload';
```

### Method 3: Contact Supabase Support
If nothing works, Supabase support can manually restart PostgREST for your project.

---

## ✅ Verification Steps

After running the fix, verify:

### 1. Check Table Structure
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;
```

**Expected columns:**
- `id` (uuid)
- `tenant_id` (uuid) ← Must exist
- `user_id` (uuid)
- `business_name` (text)
- `business_tagline` (text)
- `business_type` (varchar)
- `business_email` (text)
- `business_phone` (text)
- `business_address` (text)
- `logo_url` (text)
- `primary_color` (varchar)
- `currency` (varchar)
- `currency_symbol` (varchar)
- `tiktok_url` (text)
- `instagram_url` (text)
- `facebook_url` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 2. Check for Orphaned Records
```sql
SELECT * FROM shop_settings WHERE tenant_id IS NULL;
```

**Expected:** 0 rows (no orphaned records)

### 3. Check Shop Settings Data
```sql
SELECT 
  s.id,
  t.business_name as tenant,
  s.business_name as settings_name,
  s.tenant_id
FROM shop_settings s
LEFT JOIN tenants t ON s.tenant_id = t.id;
```

**Expected:** Each shop_settings record should have a valid `tenant_id`

---

## 🚨 If Error Persists

### Option 1: Run Complete Migration
Run the full script: `lib/fix-user-email-error-complete.sql`

This script:
- ✅ Adds missing columns
- ✅ Migrates existing data
- ✅ Deletes orphaned records
- ✅ Updates RLS policies
- ✅ Forces schema cache refresh
- ✅ Verifies the fix

### Option 2: Check API Code
The API expects `tenant_id` column. Verify it exists:
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'shop_settings' 
  AND column_name = 'tenant_id'
) as tenant_id_exists;
```

Should return: `true`

### Option 3: Restart Supabase Project
In Supabase dashboard:
1. Go to **Settings** → **General**
2. Scroll to **Danger Zone**
3. Click **Pause Project**
4. Wait 1 minute
5. Click **Resume Project**

This forces a complete restart of all services including PostgREST.

---

## 📝 Summary

**Problem:** PostgREST schema cache is outdated  
**Solution:** Run `NOTIFY pgrst, 'reload schema';`  
**Time:** 30 seconds to take effect  
**Result:** Shop Settings should work without errors

---

## 🆘 Still Not Working?

If the error persists after trying all methods:

1. **Check Supabase Status:** https://status.supabase.com
2. **Check Browser Console:** F12 → Console tab for detailed errors
3. **Verify Login:** Make sure you're logged in correctly
4. **Try Different Browser:** Test in Incognito mode
5. **Contact Support:** Provide error message and project ID

---

## ✅ Success Indicators

You'll know it's fixed when:
- ✅ No error message when opening Shop Settings
- ✅ Can edit and save settings successfully
- ✅ Changes persist after page refresh
- ✅ No console errors in browser DevTools
