# Vercel Deployment Fix Guide

## Current Issue
Dashboard is not showing real data despite code being pushed to GitHub. Vercel appears to not be deploying new changes.

## Diagnostic Steps

### 1. Verify Environment Variables on Vercel
**CRITICAL**: The dashboard API needs `SUPABASE_SERVICE_ROLE_KEY` to work.

Go to: https://vercel.com/dashboard
1. Select your project: `smart-pos-system`
2. Go to **Settings** → **Environment Variables**
3. Check if `SUPABASE_SERVICE_ROLE_KEY` exists
4. If NOT, add it:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `REDACTED_JWT_TOKEN`
   - Environments: Check ALL (Production, Preview, Development)
   - Click **Save**

### 2. Check Vercel Deployment Status
1. Go to: https://vercel.com/dashboard
2. Click on your project: `smart-pos-system`
3. Go to **Deployments** tab
4. Check the latest deployment:
   - Status should be "Ready" (green checkmark)
   - Commit message should be: "Add environment verification endpoint and dashboard version indicator"
   - If status is "Failed" or "Canceled", click on it to see error logs

### 3. Verify Environment Variables Are Working
Once deployed, visit:
```
https://smart-pos-system.vercel.app/api/verify-env
```

You should see:
```json
{
  "timestamp": "2026-04-18T...",
  "buildId": "1d2179b...",
  "hasSupabaseUrl": true,
  "hasSupabaseAnonKey": true,
  "hasSupabaseServiceKey": true,  // <-- MUST be true
  "supabaseUrl": "https://ugemjqouxnholwlgvzer.supabase.co",
  "nodeEnv": "production",
  "vercelEnv": "production"
}
```

**If `hasSupabaseServiceKey` is false:**
- Environment variable is NOT set on Vercel
- Go back to Step 1 and add it
- After adding, you MUST redeploy (see Step 4)

### 4. Force Manual Redeploy
If environment variable was missing and you just added it:

1. Go to: https://vercel.com/dashboard
2. Select your project: `smart-pos-system`
3. Go to **Deployments** tab
4. Find the latest deployment
5. Click the **three dots (...)** on the right
6. Click **Redeploy**
7. Select **Use existing Build Cache** (faster) or uncheck for fresh build
8. Click **Redeploy**
9. Wait 2-5 minutes for deployment to complete

### 5. Verify Dashboard Version
After deployment completes:

1. Visit: https://smart-pos-system.vercel.app/dashboard
2. **Hard refresh** your browser:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
3. Look under the "Dashboard" heading
4. You should see: **"Version: 2.0 (Real Data)"**
5. If you still see old version, clear browser cache completely

### 6. Check Dashboard Data
If version shows "2.0 (Real Data)" but still shows zeros:
- This is NORMAL if you haven't made any sales today
- The dashboard shows TODAY'S sales only
- To test, make a sale on the POS page first

## Common Issues

### Issue 1: "hasSupabaseServiceKey: false"
**Solution**: Add the environment variable to Vercel (Step 1), then redeploy (Step 4)

### Issue 2: Deployment shows old commit
**Solution**: 
- Check if auto-deploy is enabled in Vercel
- Go to Settings → Git → Check "Auto-deploy" is ON
- Manually trigger redeploy (Step 4)

### Issue 3: Browser shows old version
**Solution**:
- Hard refresh (Ctrl + Shift + R)
- Clear browser cache
- Try incognito/private window
- Try different browser

### Issue 4: Dashboard shows all zeros
**Solution**:
- This is NORMAL if no sales made today
- Go to POS page and make a test sale
- Return to dashboard to see updated numbers

## Quick Test Checklist

- [ ] Environment variable `SUPABASE_SERVICE_ROLE_KEY` added to Vercel
- [ ] Latest deployment shows "Ready" status
- [ ] `/api/verify-env` shows `hasSupabaseServiceKey: true`
- [ ] Dashboard shows "Version: 2.0 (Real Data)"
- [ ] Hard refresh browser (Ctrl + Shift + R)
- [ ] Made at least one test sale on POS page

## Still Not Working?

If after all steps the dashboard still shows mock data:

1. Check Vercel build logs for errors:
   - Go to Deployments → Click on latest → View Build Logs
   - Look for any errors related to Supabase or API routes

2. Check browser console for errors:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for any red errors
   - Share screenshot if needed

3. Verify Supabase database has data:
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Go to Table Editor
   - Check `products` table has 19 products
   - Check `customers` table has data
   - Check `transactions` table (may be empty if no sales)

## Contact Support
If issue persists, provide:
1. Screenshot of `/api/verify-env` response
2. Screenshot of Vercel deployment status
3. Screenshot of dashboard showing version number
4. Screenshot of browser console errors (if any)
