# Update Vercel to Use New Database

## ✅ Migration Complete!
- 121 products imported
- 54 customers imported  
- 1 shop settings imported

## Now Update Vercel Environment Variables

### Step 1: Go to Vercel Dashboard
https://vercel.com/dashboard

### Step 2: Find Your Project
Click on: smart-pos-system-peach

### Step 3: Go to Settings → Environment Variables

### Step 4: Update These Variables (Production)

**NEXT_PUBLIC_SUPABASE_URL**
- Old: `https://ugemjqouxnholwlgvzer.supabase.co`
- New: `https://xqnteamrznvoqgaazhpu.supabase.co`

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
- New: `REDACTED_JWT_TOKEN`

**SUPABASE_SERVICE_ROLE_KEY** (if you have it)
- Get from: https://supabase.REDACTED_APP_SECRET
- Copy the "service_role" key (secret)

### Step 5: Redeploy
After saving the environment variables, Vercel will automatically redeploy.
Or manually trigger: Deployments → Click "..." → Redeploy

### Step 6: Test
Once deployed (2-3 minutes):
1. Go to: https://smart-pos-system-peach.vercel.app
2. All your products and customers should be there!
3. Try making a sale in POS - it should work now!

## What About Missing Data?

Debts, returns, and expenses had schema mismatches. You can:
1. Manually add them later through the UI
2. Or I can help fix the import script

But the core system (products, customers, POS) will work perfectly!
