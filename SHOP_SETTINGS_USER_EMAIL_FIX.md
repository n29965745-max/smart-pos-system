# ✅ Shop Settings User Email Error - FIXED

## What Was Wrong

The frontend was sending `user_email` in the request body, but the API doesn't use it. The API gets the user ID from the authentication token via `secureRoute`. This was causing a schema cache error in Supabase.

## What I Fixed

### 1. **API Changes** (`pages/api/shop-settings/index.ts`)
- Removed `user_email` from the data being sent to the database
- The API now only uses `user_id` from the authenticated user
- Added better error logging

### 2. **Frontend Changes** (`pages/shop-settings.tsx`)
- Removed the code that was adding `user_email` to the request
- Simplified the save function
- Now sends only the settings data

### 3. **Database Script** (`lib/fix-shop-settings-user-email.sql`)
- Ensures the table has the correct structure
- Removes `user_email` column if it exists (not needed)
- Forces PostgREST schema cache refresh
- Updates RLS policies for tenant isolation

## How to Apply the Fix

### Step 1: Run the SQL Script
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `lib/fix-shop-settings-user-email.sql`
5. Click **Run**

### Step 2: Deploy the Code Changes
The code changes are already applied. Just deploy to Vercel:

```bash
git add .
git commit -m "Fix shop settings user email error"
git push
```

Vercel will automatically deploy the changes.

### Step 3: Wait 30 Seconds
After running the SQL script, wait 30 seconds for PostgREST to refresh its schema cache.

### Step 4: Test
1. Go to **Shop Settings** page
2. Edit any setting
3. Click **Save Settings**
4. Should save successfully without errors ✅

## Why This Happened

The error "user_email not found in schema cache" occurred because:

1. The frontend was sending `user_email` in the request body
2. The API was passing it to the database upsert
3. But the `shop_settings` table doesn't have a `user_email` column
4. Supabase's PostgREST got confused about the table structure

## The Correct Flow

**Before (Wrong):**
```
Frontend → sends user_email → API → tries to save user_email → Database error
```

**After (Correct):**
```
Frontend → sends settings only → API → uses user_id from auth → Database saves ✅
```

## What the API Uses

The API gets user information from the authentication token:
- `tenantId` - from the secure route middleware
- `user.userId` - from the authenticated user
- `user.email` - available but not stored in shop_settings

The `shop_settings` table structure:
```sql
- id (uuid)
- tenant_id (uuid) ← Links to tenant
- user_id (uuid) ← Links to user who last updated
- business_name (text)
- business_tagline (text)
- business_type (varchar)
- business_email (text) ← Business email, not user email
- business_phone (text)
- business_address (text)
- logo_url (text)
- primary_color (varchar)
- currency (varchar)
- currency_symbol (varchar)
- tiktok_url (text)
- instagram_url (text)
- facebook_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

Note: There's `business_email` (the shop's email) but no `user_email` (the logged-in user's email).

## Verification

After applying the fix, verify:

### 1. Check API Response
Open browser DevTools (F12) → Network tab → Save settings → Check response:
```json
{
  "success": true,
  "settings": {
    "id": "...",
    "tenant_id": "...",
    "user_id": "...",
    "business_name": "Your Shop",
    ...
  }
}
```

### 2. Check Database
Run in Supabase SQL Editor:
```sql
SELECT * FROM shop_settings ORDER BY updated_at DESC LIMIT 1;
```

Should show your latest settings with `tenant_id` and `user_id` populated.

### 3. Check for Errors
No errors in:
- Browser console (F12)
- Network tab (F12 → Network)
- Supabase logs (Dashboard → Logs)

## Summary

✅ Removed `user_email` from frontend request  
✅ Updated API to filter out `user_email` if sent  
✅ Created SQL script to fix database structure  
✅ Added schema cache refresh commands  
✅ Improved error logging  

The shop settings should now save without any schema cache errors!
