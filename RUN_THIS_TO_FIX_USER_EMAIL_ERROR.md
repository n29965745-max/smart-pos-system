# 🔧 Fix "user_email" Error - 3 Simple Steps

## Error You're Seeing:
```
could not find the 'user_email' of 'shop_settings' in the schema cache
```

---

## ⚡ QUICK FIX (3 Steps)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Run This SQL

**Option A: Simplest Fix (Recommended)**
Open and run: **`lib/SIMPLE_FIX_SCHEMA_CACHE.sql`**

Just 3 lines:
```sql
DELETE FROM shop_settings WHERE tenant_id IS NULL;
NOTIFY pgrst, 'reload schema';
SELECT 'Schema cache refreshed! Wait 30 seconds then try Shop Settings.' as status;
```

**Option B: Full Fix with Verification**
Open and run: **`lib/quick-fix-schema-cache.sql`**

Click **Run** button.

### Step 3: Wait 30 Seconds
Wait 30 seconds, then try Shop Settings again.

---

## ✅ That's It!

The error should be gone. If not, continue below...

---

## 🔍 Still Not Working? Run Full Diagnostic

### Option A: Run Diagnostic First
File: **`lib/diagnose-shop-settings-error.sql`**

This will tell you exactly what's wrong.

### Option B: Run Complete Fix
File: **`lib/fix-user-email-error-complete.sql`**

This fixes everything:
- Adds missing columns
- Deletes orphaned records
- Updates RLS policies
- Forces schema cache refresh

---

## 📋 What Each File Does

| File | Purpose | When to Use |
|------|---------|-------------|
| `diagnose-shop-settings-error.sql` | Shows what's wrong | Run first to diagnose |
| `fix-user-email-error-complete.sql` | Fixes everything | Run if quick fix doesn't work |
| `refresh-supabase-schema-cache.sql` | Just refreshes cache | Run if structure is correct |

---

## 🎯 Most Common Causes

1. **Schema cache not refreshed** → Run `NOTIFY pgrst, 'reload schema';`
2. **Orphaned records** → Run `DELETE FROM shop_settings WHERE tenant_id IS NULL;`
3. **Missing tenant_id column** → Run complete fix script
4. **Old RLS policies** → Run complete fix script

---

## 💡 Quick Test

After running the fix, test with this SQL:

```sql
-- Should return your shop settings
SELECT * FROM shop_settings WHERE tenant_id IS NOT NULL;
```

If you see records, it's working! ✅

---

## 🆘 Emergency Fix

If nothing works, run this nuclear option:

```sql
-- 1. Backup data
CREATE TABLE shop_settings_backup AS SELECT * FROM shop_settings;

-- 2. Drop and recreate table
DROP TABLE shop_settings CASCADE;

-- 3. Run the complete schema from lib/shop-settings-schema.sql

-- 4. Restore data
INSERT INTO shop_settings SELECT * FROM shop_settings_backup WHERE tenant_id IS NOT NULL;

-- 5. Refresh cache
NOTIFY pgrst, 'reload schema';
```

⚠️ **Warning:** Only use this if everything else fails!

---

## ✅ Success Checklist

- [ ] Ran SQL in Supabase
- [ ] Waited 30 seconds
- [ ] Refreshed Shop Settings page
- [ ] No error message
- [ ] Can edit and save settings

---

## 📞 Need Help?

If still not working:
1. Run `diagnose-shop-settings-error.sql`
2. Copy the output
3. Share the results so we can see exactly what's wrong
