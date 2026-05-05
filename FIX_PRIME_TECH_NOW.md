# Fix Prime Tech Electronics - Missing Shop Settings

## Problem
Prime Tech Electronics Ltd was created **before** the auto-create shop_settings fix was deployed. This means:
- ❌ No shop_settings record exists in database
- ❌ Sidebar shows loading state (no business name)
- ❌ Shop Settings page is empty
- ❌ Shop URL shows "nylawigs" (cached from previous session)

## Solution: Run SQL Backfill

### Option 1: Fix Prime Tech Only

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Copy and paste this SQL:

```sql
-- Create shop_settings for Prime Tech Electronics
INSERT INTO shop_settings (
  tenant_id,
  user_id,
  business_name,
  business_type,
  business_email,
  business_phone,
  business_address,
  business_tagline,
  logo_url,
  primary_color,
  currency,
  currency_symbol,
  tiktok_url,
  instagram_url,
  facebook_url
)
SELECT 
  t.id as tenant_id,
  u.id as user_id,
  t.business_name,
  COALESCE(t.business_type, 'Electronics Shop') as business_type,
  COALESCE(t.business_email, '') as business_email,
  COALESCE(t.business_phone, '') as business_phone,
  '' as business_address,
  COALESCE(t.tagline, '') as business_tagline,
  '' as logo_url,
  COALESCE(t.theme_color, '#10b981') as primary_color,
  COALESCE(t.currency, 'KES') as currency,
  COALESCE(t.currency_symbol, 'KSh') as currency_symbol,
  '' as tiktok_url,
  '' as instagram_url,
  '' as facebook_url
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'Admin'
LEFT JOIN shop_settings s ON s.tenant_id = t.id
WHERE t.business_name = 'Prime Tech Electronics Ltd'
  AND s.id IS NULL
  AND u.id IS NOT NULL;
```

5. Click "Run" button
6. Should see: "Success. 1 row affected" or "Success. No rows returned" (if already exists)

### Option 2: Fix ALL Tenants (Recommended)

This will fix Prime Tech AND any other tenants created before the fix:

1. Go to Supabase SQL Editor
2. Open file: `lib/backfill-all-missing-shop-settings.sql`
3. Copy the entire SQL script
4. Paste in SQL Editor
5. Click "Run"
6. Check the results - should show all tenants now have shop_settings

## After Running SQL

### 1. Clear Browser Cache
- Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
- Select "Cached images and files"
- Select "All time"
- Click "Clear data"

### 2. Clear localStorage
Open browser console (F12) and run:
```javascript
localStorage.clear();
```

### 3. Logout and Login Again
1. Logout from Prime Tech account
2. Login again with Prime Tech credentials
3. Check sidebar - should now show "Prime Tech Electronics Ltd"
4. Go to Shop Settings - should show business name and shop URL

### 4. Verify Shop URL
- Shop Settings should show: `/s/prime-tech-electronics-ltd` (or similar)
- Click "Copy Link" to get full URL
- Click "Open ↗" to test the public shop page

## Why This Happened

Prime Tech was created **before** these commits were deployed:
- `bd27b2c` - Auto-create shop_settings in onboard API
- `2b3b6fc` - Auto-create shop_settings in admin tenants API

**Timeline:**
1. Prime Tech created → No shop_settings auto-created (old code)
2. Fix deployed → New tenants get shop_settings automatically
3. Prime Tech still missing shop_settings → Needs manual backfill

## Prevention

All **new** tenants created after the fix will automatically get shop_settings. This is a one-time backfill for existing tenants.

## Verification Query

After running the backfill, verify with this query:

```sql
-- Check Prime Tech shop_settings
SELECT 
  t.business_name as tenant_name,
  t.slug as tenant_slug,
  s.business_name as shop_name,
  s.primary_color,
  s.currency,
  s.created_at as settings_created
FROM tenants t
LEFT JOIN shop_settings s ON s.tenant_id = t.id
WHERE t.business_name = 'Prime Tech Electronics Ltd';
```

Should return:
- tenant_name: "Prime Tech Electronics Ltd"
- tenant_slug: "prime-tech-electronics-ltd" (or similar)
- shop_name: "Prime Tech Electronics Ltd"
- primary_color: "#10b981"
- currency: "KES"
- settings_created: (timestamp)

## If Still Not Working

If after running SQL and clearing cache, Prime Tech still shows empty:

1. **Check if SQL ran successfully:**
   ```sql
   SELECT COUNT(*) FROM shop_settings WHERE tenant_id IN (
     SELECT id FROM tenants WHERE business_name = 'Prime Tech Electronics Ltd'
   );
   ```
   Should return: 1

2. **Check tenant_id in JWT token:**
   - Login as Prime Tech
   - Open browser console (F12)
   - Run: `localStorage.getItem('token')`
   - Decode the JWT at https://jwt.io
   - Check if `tenant_id` matches Prime Tech's tenant ID

3. **Check API response:**
   - Login as Prime Tech
   - Open Network tab in DevTools
   - Go to Shop Settings page
   - Look for `/api/shop-settings` request
   - Check response - should return Prime Tech data

## Contact

If issues persist after following all steps, provide:
1. Screenshot of SQL query result
2. Screenshot of browser console errors
3. Screenshot of Network tab showing `/api/shop-settings` response
