# 🔍 CHECK SMS SENDING NOW

## Step 1: Test Sending a Message

1. Go to **Customer Messages** page
2. Select a customer with a valid phone number
3. Type a test message
4. Click **Send**
5. **Open Browser Console (F12)** and look for these logs:

### What You Should See (Success):
```
Initializing Africa's Talking with: { username: 'NYLAWIGS', hasApiKey: true, apiKeyLength: 88 }
Sending SMS via Africa's Talking: { to: '+254XXXXXXXXX', from: 'NYLAWIGS', messageLength: XX }
Africa's Talking response: { SMSMessageData: { Recipients: [...] } }
```

### What You Might See (Failure):
```
CRITICAL: africastalking package failed to initialize: [error message]
```

---

## Step 2: Check Vercel Function Logs

If messages still aren't sending:

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Click on your project: **smart-pos-system**
3. Click **Logs** tab
4. Filter by: `/api/sms/send-manual`
5. Look for error messages

---

## Step 3: Verify Environment Variables

Go to Vercel → Project Settings → Environment Variables

**MUST BE SET TO THESE EXACT VALUES:**

```
AFRICASTALKING_API_KEY=REDACTED

AFRICASTALKING_USERNAME = NYLAWIGS
(NOT "sandbox" - this is critical!)

AFRICASTALKING_SENDER_ID = NYLAWIGS

CRON_SECRET=REDACTED
```

**If you changed any of these, you MUST redeploy:**
- Go to Vercel → Deployments
- Click the 3 dots on latest deployment
- Click "Redeploy"

---

## Step 4: Check Africa's Talking Account

Login to: https://account.africastalking.com

1. **Check API Key Status**: Make sure it's active
2. **Check Balance**: Ensure you have credit
3. **Check Sender ID**: Verify "NYLAWIGS" is approved
4. **Check Username**: Should be "NYLAWIGS" (not sandbox)

---

## Common Issues:

### Issue 1: "africastalking package failed to initialize"
**Cause**: Package not installed or credentials invalid
**Fix**: Check Vercel build logs to see if package installed

### Issue 2: Messages show "sent" but don't arrive
**Cause**: Using sandbox mode or invalid credentials
**Fix**: Verify `AFRICASTALKING_USERNAME = NYLAWIGS` in Vercel

### Issue 3: "Invalid phone number"
**Cause**: Phone number format wrong
**Fix**: System auto-formats to +254XXXXXXXXX for Kenya

### Issue 4: "Insufficient balance"
**Cause**: No credit in Africa's Talking account
**Fix**: Add credit to your account

---

## What to Share With Me:

1. **Console logs** from browser (F12 → Console tab)
2. **Response** you get when clicking Send
3. **Vercel function logs** if available
4. **Screenshot** of environment variables (hide sensitive parts)

This will help me pinpoint the exact issue!
