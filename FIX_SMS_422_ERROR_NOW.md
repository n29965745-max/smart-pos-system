# Fix SMS 422 Error - Step by Step

## Current Situation
- ✅ Test script works perfectly (sends SMS successfully)
- ❌ Customer Messages page fails with 422 error
- ✅ Celcom account has credits (KSH 62.40)
- ✅ You added 5 environment variables to Vercel

## The Problem
The 422 error means Celcom API is rejecting the request format. This usually happens when environment variables have **extra quotes or spaces** around them.

## Fix It Now - 3 Steps

### Step 1: Check Your Environment Variables
I just pushed an improved diagnostic tool. After Vercel redeploys (wait 2 minutes), visit:

```
https://your-domain.vercel.app/api/debug/check-env
```

This will show you EXACTLY what's wrong with your environment variables.

### Step 2: Fix the Issues in Vercel
Go to: **Vercel → Settings → Environment Variables**

For each variable, make sure the value has:
- ❌ NO quotes around it
- ❌ NO spaces before or after
- ✅ Just the plain value

**Correct Format:**
```
SMS_PROVIDER
celcom
(no quotes, no spaces)

CELCOM_API_KEY
0621e4ea38a9d2b9000c97c90bf40c97
(no quotes, no spaces)

CELCOM_PARTNER_ID
36
(no quotes, no spaces)

CELCOM_SENDER_ID
TEXTME
(no quotes, no spaces)

SMS_TEST_MODE
false
(no quotes, no spaces)
```

**Wrong Format (Don't Do This):**
```
❌ "celcom"
❌ 'celcom'
❌  celcom  (spaces)
❌ "0621e4ea38a9d2b9000c97c90bf40c97"
```

### Step 3: Redeploy with Latest Commit
After fixing the variables:

1. Go to **Vercel → Deployments**
2. Click **3 dots** on latest deployment
3. Click **Redeploy**
4. Select **"Use Latest Commit"** (NOT "Use Existing Build")
5. Wait 1-2 minutes for deployment

### Step 4: Test
1. Go to Customer Messages page
2. Send a test message
3. Customer should receive it!

## Why This Happens

When you add environment variables in Vercel's UI, it's easy to accidentally:
- Copy-paste with quotes: `"celcom"` instead of `celcom`
- Add spaces: ` celcom ` instead of `celcom`

The test script works because `.env.local` file doesn't have these issues.

## Quick Verification

After redeploying, check the diagnostic again:
```
https://your-domain.vercel.app/api/debug/check-env
```

It should say: **"ALL GOOD ✅"**

## Still Not Working?

If the diagnostic says "ALL GOOD" but SMS still fails:

1. Check Vercel logs:
   - Go to Vercel → Deployments → Latest → View Function Logs
   - Look for errors when sending SMS

2. The logs will show the exact error from Celcom API

3. Share the error with me and I'll fix it

## Common Issues

### Issue 1: Variables Have Quotes
**Problem:** `SMS_PROVIDER = "celcom"` (with quotes)
**Fix:** Change to `celcom` (no quotes)

### Issue 2: Variables Have Spaces
**Problem:** `CELCOM_PARTNER_ID = " 36 "` (with spaces)
**Fix:** Change to `36` (no spaces)

### Issue 3: Wrong Environment Scope
**Problem:** Variables only set for "Production"
**Fix:** Check all 3 boxes: Production, Preview, Development

### Issue 4: Old Build Cached
**Problem:** Vercel using old build without new variables
**Fix:** Redeploy with "Use Latest Commit" (not "Use Existing Build")

## Expected Result

After fixing:
- ✅ Diagnostic shows "ALL GOOD ✅"
- ✅ Customer Messages page sends SMS successfully
- ✅ Customer receives message within 1-2 minutes
- ✅ Message status in database shows "sent" (not "failed")

## Need Help?

If you're still stuck after trying these steps:
1. Visit the diagnostic URL and screenshot the results
2. Share the screenshot with me
3. I'll tell you exactly what to fix
