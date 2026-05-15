# Setup Supabase Service Role Key

## Problem
The POS page shows no products because the API is missing the `SUPABASE_SERVICE_ROLE_KEY` environment variable.

## Solution - Follow These Steps:

### Step 1: Get Your Service Role Key

1. Go to: https://supabase.REDACTED_APP_SECRET
2. Scroll down to "Project API keys"
3. Find the **service_role** key (NOT the anon key)
4. Click the eye icon to reveal it
5. Copy the entire key

### Step 2: Add to Local Environment

1. Open `.env.local` file in your project
2. Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key
3. Save the file

Your `.env.local` should look like:
```
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M..."
```

### Step 3: Add to Vercel (IMPORTANT!)

1. Go to: https://vercel.com/dashboard
2. Select your `smart-pos-system` project
3. Go to Settings → Environment Variables
4. Add new variable:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: (paste your service role key)
   - **Environment**: Production, Preview, Development (select all)
5. Click "Save"

### Step 4: Redeploy

After adding the environment variable to Vercel:
1. Go to Deployments tab
2. Click the three dots (...) on the latest deployment
3. Click "Redeploy"
4. Wait 2-3 minutes for deployment to complete

### Step 5: Add Products to Database

Once the API is working, add demo products:

1. Go to Supabase SQL Editor: https://supabase.REDACTED_APP_SECRET
2. Copy the SQL from `lib/demo-products.sql`
3. Paste and run it
4. Verify: `SELECT COUNT(*) FROM products;`

### Step 6: Test

1. Hard refresh your browser (Ctrl + Shift + R)
2. Go to POS page
3. Products should now appear!

## Why This Happened

The product APIs (`/api/products/list` and `/api/products/search`) use Supabase to fetch data. They need the service role key to bypass Row Level Security (RLS) policies and access the database.

Without this key, the APIs fail silently and return empty arrays.

## Quick Check

Test if your API is working:
```
https://smart-pos-system.vercel.app/api/products/list
```

Should return JSON with products array (after adding the key and products).
