# CRITICAL: Vercel Environment Variables Setup

## Problem
The system shows empty because Vercel doesn't have the correct environment variables.

## Solution: Add These to Vercel

Go to: https://vercel.com/brunowachira001-coders-projects/smart-pos-system/settings/environment-variables

Add these variables:

### 1. NEXT_PUBLIC_SUPABASE_URL
```
https://xqnteamrznvoqgaazhpu.supabase.co
```

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
REDACTED_JWT_TOKEN
```

### 3. SUPABASE_SERVICE_ROLE_KEY
**YOU NEED TO GET THIS FROM SUPABASE:**
1. Go to: https://supabase.REDACTED_APP_SECRET
2. Copy the "service_role" key (secret)
3. Add it to Vercel

### 4. Other Variables (Optional but recommended)
```
ENCRYPTION_KEY=REDACTED
JWT_SECRET=REDACTED
JWT_REFRESH_SECRET=REDACTED
REDIS_URL=redis://default:REDACTED_REDIS_PASSWORD@free-pig-97875.upstash.io:6379
```

## Steps:
1. Go to Supabase dashboard and get the service_role key
2. Add all variables to Vercel
3. Redeploy the app
4. Hard refresh (Ctrl + Shift + R)

## Test After Setup:
Visit: https://smart-pos-system-peach.vercel.app/api/test-db-connection
Should show: 121 products, 54 customers, etc.
