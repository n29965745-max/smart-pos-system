# Refresh Supabase Schema Cache - Fix "user_email not found" Error

## The Problem

The error "could not find the 'user_email' of 'shop_settings' in the schema cache" means Supabase's PostgREST layer is using an old cached version of the table schema. Even though we added the `tenant_id` column, Supabase hasn't refreshed its cache yet.

## ✅ SOLUTION - Force Schema Refresh

### Method 1: Notify PostgREST (Easiest)

Run this in Supabase SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

This tells Supabase to immediately reload the schema cache.

### Method 2: Add Table Comment (Forces Refresh)

If Method 1 doesn't work, run this:

```sql
COMMENT ON TABLE shop_settings IS 'Shop settings - schema refreshed May 5 2026';
```

Any schema change (even just a comment) forces PostgREST to reload.

### Method 3: Restart Supabase Project (Nuclear Option)

1. Go to Supabase Dashboard
2. Click **Settings** → **General**
3. Scroll to **"Pause project"**
4. Click **"Pause project"** button
5. Wait 10 seconds
6. Click **"Resume project"**

This completely restarts all Supabase services including PostgREST.

---

## 🔍 Verify the Fix

After running one of the methods above, verify the schema is correct:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;
```

You should see:
- ✅ `tenant_id` (uuid)
- ✅ `business_name` (character varying)
- ✅ `business_type` (character varying)
- ✅ All other columns

---

## 🔄 Then Test Shop Settings

1. Wait 30 seconds after running the SQL
2. Go to Shop Settings page
3. Press `Ctrl+F5` to hard refresh
4. Try editing settings

Should work now!

---

## 📝 Why This Happens

Supabase uses PostgREST to auto-generate REST APIs from your database schema. PostgREST caches the schema for performance. When you add/remove columns, you need to tell PostgREST to reload its cache.

The `NOTIFY pgrst, 'reload schema'` command is the official way to do this.

---

## 🆘 If Still Not Working

1. **Check if tenant_id column exists:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'shop_settings' AND column_name = 'tenant_id';
   ```
   
   If this returns nothing, the column wasn't added. Run the migration again.

2. **Check Supabase logs:**
   - Go to Supabase Dashboard → **Logs** → **PostgREST**
   - Look for any errors about shop_settings

3. **Try restarting the project** (Method 3 above)

---

## ✅ Expected Result

After schema refresh:
- ✅ No more "user_email not found" error
- ✅ Shop Settings page loads
- ✅ Can edit and save settings
- ✅ Each tenant sees only their own settings
