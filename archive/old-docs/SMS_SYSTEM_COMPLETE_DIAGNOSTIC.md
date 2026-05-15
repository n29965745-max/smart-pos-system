# SMS System Complete Diagnostic

## Current Status
- ✅ Celcom account has credits (KSH 62.40)
- ✅ Test script works (sends SMS successfully)
- ❌ Customer Messages page doesn't work
- ✅ Vercel environment variables added
- ✅ Vercel redeployed

## Diagnostic Steps

### Step 1: Check Recent Messages in Database
Run this SQL in Supabase:

```sql
SELECT 
  id,
  phone_number,
  LEFT(message_text, 60) as message_preview,
  status,
  error_message,
  sent_at,
  created_at,
  message_type
FROM message_queue
ORDER BY created_at DESC
LIMIT 5;
```

**What to look for:**
- Are messages being logged?
- What is the status? (sent/failed/pending)
- What is the error_message?

### Step 2: Check Vercel Logs
1. Go to https://vercel.com/
2. Open your project
3. Click **"Logs"** tab
4. Look for recent SMS-related errors
5. Search for "SMS" or "Celcom" in logs

**What to look for:**
- "SMS Service initialized with provider: celcom"
- Any error messages when sending SMS
- API call failures

### Step 3: Test from Browser Console
1. Open your Customer Messages page
2. Open browser console (F12)
3. Try sending a message
4. Check console for errors

**What to look for:**
- Network errors (red in Network tab)
- JavaScript errors in Console tab
- API response errors

### Step 4: Verify Environment Variables Are Live
Create a test API endpoint to check:

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Verify all 4 variables are there:
   - SMS_PROVIDER = celcom
   - CELCOM_API_KEY=REDACTED
   - CELCOM_PARTNER_ID = 36
   - CELCOM_SENDER_ID = TEXTME

### Step 5: Check if Message Reached Celcom API
If messages are in database with status "sent" but customer didn't receive:
- Login to https://isms.celcomafrica.com/
- Check message history
- Check delivery reports

## Common Issues

### Issue 1: Messages Not in Database
**Symptom:** No messages in message_queue table
**Cause:** Frontend not calling API correctly
**Fix:** Check browser console for errors

### Issue 2: Messages in Database with "failed" Status
**Symptom:** Messages logged but status = 'failed'
**Cause:** Check error_message column
**Fix:** Based on error message

### Issue 3: Messages in Database with "sent" Status but Not Delivered
**Symptom:** Status = 'sent' but customer didn't receive
**Cause:** Celcom API accepted but didn't deliver
**Fix:** Check Celcom dashboard for delivery status

### Issue 4: Environment Variables Not Loading
**Symptom:** Vercel logs show wrong provider or missing credentials
**Cause:** Deployment didn't pick up new variables
**Fix:** Redeploy again, wait 2-3 minutes

## Quick Test Commands

### Test 1: Check if Celcom is being used
Look in Vercel logs for:
```
SMS Service initialized with provider: celcom
```

### Test 2: Send test message and check database immediately
```sql
SELECT * FROM message_queue 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

### Test 3: Check Celcom balance
```bash
node test-celcom-now.js
```

## Next Steps Based on Results

### If messages ARE in database:
- Check error_message column
- Check Celcom dashboard
- Verify phone numbers are correct

### If messages are NOT in database:
- Check browser console errors
- Check Vercel logs for API errors
- Verify frontend is calling correct API endpoint

### If messages show "sent" but not delivered:
- Check Celcom dashboard delivery reports
- Verify customer's phone number
- Check if customer's phone is on

## Need More Help?

Run these and share results:
1. SQL query from Step 1
2. Screenshot of Vercel logs
3. Screenshot of browser console when sending message
4. Output of: `node test-celcom-now.js 254743794815`
