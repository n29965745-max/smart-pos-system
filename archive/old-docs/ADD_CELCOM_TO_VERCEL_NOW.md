# Add Celcom SMS to Vercel - URGENT FIX

## Problem
- Test script works (sends SMS successfully)
- Customer Messages page doesn't work (messages not reaching customers)
- **Root Cause**: Vercel doesn't have Celcom environment variables

## Solution: Add These Variables to Vercel

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/
2. Click on your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add These 4 Variables

Add each of these one by one:

#### Variable 1: SMS_PROVIDER
```
Name: SMS_PROVIDER
Value: celcom
Environment: Production, Preview, Development (check all 3)
```

#### Variable 2: CELCOM_API_KEY
```
Name: CELCOM_API_KEY
Value: REDACTED_HEX_SECRET
Environment: Production, Preview, Development (check all 3)
```

#### Variable 3: CELCOM_PARTNER_ID
```
Name: CELCOM_PARTNER_ID
Value: 36
Environment: Production, Preview, Development (check all 3)
```

#### Variable 4: CELCOM_SENDER_ID
```
Name: CELCOM_SENDER_ID
Value: TEXTME
Environment: Production, Preview, Development (check all 3)
```

### Step 3: Redeploy
After adding all 4 variables:
1. Go to **Deployments** tab
2. Click the **3 dots** on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (1-2 minutes)

### Step 4: Test
1. Go to your Customer Messages page
2. Select a customer
3. Send a test message
4. Customer should receive it within 1-2 minutes

## Quick Copy-Paste Format

If Vercel allows bulk import, use this:

```env
SMS_PROVIDER=celcom
CELCOM_API_KEY=REDACTED
CELCOM_PARTNER_ID=36
CELCOM_SENDER_ID=TEXTME
```

## Why This Fixes It

- Your local test script uses `.env.local` file ✅
- Your production website uses Vercel environment variables ❌ (missing)
- Once you add them to Vercel, both will work ✅

## Current Status

✅ Celcom account has credits (KSH 62.40)
✅ API credentials are valid
✅ Test script works perfectly
❌ Vercel doesn't have the variables (THIS IS THE ISSUE)

## After Adding Variables

Your Customer Messages page will work exactly like the test script!
