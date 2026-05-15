# Migrate to New Supabase Database

## Plan
Migrate from old database (`ugemjqouxnholwlgvzer` - no access) to new database (`xqnteamrznvoqgaazhpu` - you have access)

## Step 1: Setup New Database Schema

Go to Supabase dashboard for project `xqnteamrznvoqgaazhpu`:
https://supabase.REDACTED_APP_SECRET

Click "SQL Editor" → "New query" and run `lib/setup-complete-database.sql`

This creates all tables with proper structure.

## Step 2: Export Data from Old Database

We'll use the API to export data since we can't access the dashboard.

Run: `node export-old-database.js`

This will create JSON files with all your data:
- products.json
- customers.json  
- debts.json
- returns.json
- expenses.json
- etc.

## Step 3: Import Data to New Database

Run: `node import-to-new-database.js`

This imports all the JSON data into the new database.

## Step 4: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Find project: smart-pos-system-peach
3. Settings → Environment Variables
4. Update these variables for Production:
   - NEXT_PUBLIC_SUPABASE_URL: https://xqnteamrznvoqgaazhpu.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY: (get from new project settings)
   - SUPABASE_SERVICE_ROLE_KEY: (get from new project settings)

## Step 5: Redeploy

Vercel will auto-redeploy with new variables, or trigger manually.

## Step 6: Test

Test all features to ensure migration worked!
