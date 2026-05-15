# CRITICAL: Fix Empty System - Environment Variables Missing

## Problem
Your POS system shows empty because Vercel doesn't have the Supabase environment variables configured.

## IMMEDIATE FIX - Do This Now:

### Step 1: Go to Vercel Dashboard
https://vercel.com/brunowachira001-coders-projects/smart-pos-system/settings/environment-variables

### Step 2: Add These 2 Variables (MINIMUM REQUIRED):

1. **NEXT_PUBLIC_SUPABASE_URL**
   ```
   https://xqnteamrznvoqgaazhpu.supabase.co
   ```

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   ```
   REDACTED_JWT_TOKEN
   ```

### Step 3: Redeploy
After adding variables, click "Redeploy" in Vercel dashboard or wait for automatic deployment.

### Step 4: Test
Wait 2-3 minutes, then visit:
- https://smart-pos-system-peach.vercel.app/api/test-db-connection
- Should show: 121 products, 54 customers, 18 returns, 10 expenses, 4 debts, 1 shop_settings

### Step 5: Hard Refresh
- Go to https://smart-pos-system-peach.vercel.app
- Press Ctrl + Shift + R (hard refresh)
- All data should now appear!

## What Was Fixed in Code:
1. Created centralized Supabase client (`lib/supabase-client.ts`)
2. Updated all API files to use the centralized client
3. Added fallback to ANON key if SERVICE_ROLE key is missing
4. APIs now work with just the 2 public environment variables

## Why This Happened:
- Local `.env.local` has the variables
- Vercel deployment doesn't automatically copy them
- You must manually add them in Vercel dashboard

## Data Status:
✅ Database has all data (verified in Supabase)
✅ 121 products
✅ 54 customers  
✅ 18 returns
✅ 10 expenses
✅ 4 debts
✅ 1 shop settings (Nyla Wigs)

The data is there - the app just can't see it without the environment variables!
