# 📱 SMS Not Sending - Complete Fix Guide

## 🔑 Your Africa's Talking Credentials

**API Key:** `REDACTED_AFRICASTALKING_KEY`

**Username:** `sandbox` (⚠️ This is TEST MODE - see below for production)

**Sender ID:** `NYLAWIGS`

---

## ⚠️ IMPORTANT: Sandbox vs Production

### Current Status: SANDBOX MODE (Test Mode)

**What this means:**
- ✅ SMS will be sent to Africa's Talking test numbers only
- ❌ Real customer phones will NOT receive messages
- ✅ Good for testing the system
- ❌ Not good for actual business use

### To Enable REAL SMS (Production):

**Step 1: Login to Africa's Talking**
- Go to: https://account.africastalking.com/auth/login
- Login with your account

**Step 2: Get Production Username**
- Click on your profile/settings
- Look for "Username" (NOT "sandbox")
- Copy your production username (example: "nylawigs" or similar)

**Step 3: Update Environment Variables**
Replace `AFRICASTALKING_USERNAME="sandbox"` with your production username

**Step 4: Check SMS Balance**
- In Africa's Talking dashboard, check "SMS Balance"
- You need credits to send SMS
- Buy credits if balance is low

**Step 5: Verify Sender ID**
- Check if "NYLAWIGS" is approved as Sender ID
- If not approved, request approval or use default

---

## 🚀 Fix Steps (Do This Now)

### Step 1: Add Environment Variables to Vercel

**Go to Vercel Dashboard:**
1. Visit: https://vercel.com/dashboard
2. Select your project (Nyla Wigs POS)
3. Click **Settings** → **Environment Variables**

**Add These 4 Variables:**

| Name | Value |
|------|-------|
| `AFRICASTALKING_API_KEY` | `REDACTED_AFRICASTALKING_KEY` |
| `AFRICASTALKING_USERNAME` | `sandbox` (or your production username) |
| `AFRICASTALKING_SENDER_ID` | `NYLAWIGS` |
| `CRON_SECRET` | `REDACTED_CRON_SECRET` |

**Important:** Select "Production", "Preview", and "Development" for each variable

### Step 2: Redeploy

After adding variables:
1. Go to **Deployments** tab
2. Click the 3 dots (...) on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 3: Test SMS

1. Open your app: https://your-app.vercel.app
2. Go to **Customer Messages** page
3. Click **"Send Message"** button
4. Type: `Hi {name}! This is a test from Nyla Wigs`
5. Select a customer
6. Click **Send**

---

## 🔍 Diagnostic Checks

### Check 1: Run This SQL in Supabase

```sql
-- Check recent messages
SELECT 
  phone_number,
  message_text,
  status,
  error_message,
  created_at
FROM message_queue
ORDER BY created_at DESC
LIMIT 5;
```

**What to look for:**
- ✅ `status = 'sent'` → Message sent successfully
- ❌ `status = 'failed'` → Check `error_message` column
- ⏳ `status = 'pending'` → Message waiting to be sent

### Check 2: Verify Phone Number Format

```sql
-- Check customer phone numbers
SELECT name, phone FROM customers LIMIT 10;
```

**Valid formats:**
- ✅ `0712345678` (Kenya format)
- ✅ `+254712345678` (International)
- ✅ `254712345678` (Without +)
- ❌ `712345678` (Missing leading 0)

### Check 3: Check Vercel Logs

1. Go to Vercel Dashboard
2. Click **Logs** or **Functions**
3. Look for recent SMS requests
4. Check for errors like:
   - "API key missing"
   - "SMS sending error"
   - "Invalid phone number"

---

## 🐛 Common Issues & Solutions

### Issue 1: "Customer didn't receive message"

**Possible Causes:**
1. ❌ Using sandbox mode (only test numbers work)
2. ❌ Environment variables not set in Vercel
3. ❌ Invalid phone number format
4. ❌ No SMS credits in Africa's Talking account

**Solution:**
- Switch to production username (not "sandbox")
- Add env vars to Vercel
- Check phone number format
- Buy SMS credits

### Issue 2: Message shows "sent" but not received

**Possible Causes:**
1. ❌ Sandbox mode (messages only go to test numbers)
2. ❌ Phone number not registered in sandbox
3. ❌ Network delay (can take 1-2 minutes)

**Solution:**
- Use production username
- Wait 2-3 minutes
- Check Africa's Talking delivery reports

### Issue 3: "API key missing" error

**Possible Causes:**
1. ❌ Environment variables not set in Vercel
2. ❌ Deployment not redeployed after adding vars

**Solution:**
- Add env vars to Vercel
- Redeploy the application

---

## 📊 Monitor SMS Status

### Check Total Messages Sent Today

```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  SUM(cost) as total_cost
FROM message_queue
WHERE DATE(created_at) = CURRENT_DATE;
```

### Check Messages Per Customer

```sql
SELECT 
  c.name,
  c.phone,
  COUNT(mq.id) as messages_sent,
  MAX(mq.created_at) as last_message
FROM customers c
LEFT JOIN message_queue mq ON c.id = mq.customer_id
GROUP BY c.id, c.name, c.phone
ORDER BY messages_sent DESC
LIMIT 10;
```

---

## ✅ Checklist

Before testing, make sure:

- [ ] Environment variables added to Vercel
- [ ] Application redeployed after adding vars
- [ ] Using production username (not "sandbox") for real SMS
- [ ] SMS credits available in Africa's Talking account
- [ ] Sender ID "NYLAWIGS" is approved
- [ ] Customer phone numbers are in valid format
- [ ] Waited 2-3 minutes after sending

---

## 🎯 Quick Test (Sandbox Mode)

If you want to test in sandbox mode first:

**Step 1: Register Test Number**
1. Login to Africa's Talking
2. Go to Sandbox → SMS
3. Add your phone number as test number
4. Verify with code sent to your phone

**Step 2: Send Test Message**
1. Go to Customer Messages
2. Send message to customer with YOUR phone number
3. You should receive it (since your number is registered)

**Step 3: Switch to Production**
Once test works, switch `AFRICASTALKING_USERNAME` to production

---

## 📞 Need Help?

**Africa's Talking Support:**
- Email: support@africastalking.com
- Docs: https://developers.africastalking.com/docs/sms/overview

**Check These:**
1. SMS balance in dashboard
2. Sender ID approval status
3. API key is active
4. Username is correct (sandbox vs production)

---

## 🎉 Summary

**Your API Key:** `REDACTED_AFRICASTALKING_KEY`

**Current Mode:** Sandbox (test only)

**To Fix:**
1. Add 4 environment variables to Vercel
2. Redeploy application
3. Switch to production username for real SMS
4. Test by sending message

**The system is ready - just needs Vercel environment variables!** 🚀
