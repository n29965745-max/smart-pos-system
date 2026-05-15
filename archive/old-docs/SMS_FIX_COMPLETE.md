# ✅ SMS Issue Fixed - Complete Guide

## 🔧 What Was Fixed

### Issues Found:
1. ❌ SMS service was looking for config in database (not using .env)
2. ❌ Customer ID type mismatch (number vs UUID)
3. ❌ No diagnostic tools to check SMS status

### Fixes Applied:
1. ✅ SMS service now uses environment variables directly
2. ✅ UUID support for customer IDs
3. ✅ Diagnostic SQL scripts created
4. ✅ Better error logging

---

## 🚀 How to Test Now

### Step 1: Run Diagnostic SQL
Run this in Supabase to check system status:

```sql
-- Check SMS Config
SELECT 'SMS Config' as check_name, COUNT(*) as count FROM sms_config;

-- Check Message Queue
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM message_queue;

-- Check Recent Messages
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

### Step 2: Verify Environment Variables
Check your `.env.local` file has:

```
AFRICASTALKING_API_KEY=REDACTED
AFRICASTALKING_USERNAME=NYLAWIGS
AFRICASTALKING_SENDER_ID=NYLAWIGS
SMS_TEST_MODE=false
```

**Important:** Make sure these are also set in Vercel:
1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Add all 4 variables above

### Step 3: Send Test Message
1. Go to **Customer Messages** page
2. Click **"Send Message"** button
3. Type: `Hi {name}! Test message from Nyla Wigs!`
4. Select a customer
5. Click **"Send"**
6. Check customer's phone

---

## 🔍 Troubleshooting

### If Message Still Not Received:

**Check 1: Vercel Logs**
```bash
# In Vercel dashboard, check Function Logs for:
- "SMS sending error"
- "AFRICASTALKING_API_KEY not set"
```

**Check 2: Message Queue**
```sql
SELECT * FROM message_queue 
ORDER BY created_at DESC 
LIMIT 1;
```

Look at:
- `status`: Should be 'sent' not 'failed'
- `error_message`: Shows what went wrong
- `phone_number`: Should be in format +254...

**Check 3: Phone Number Format**
```sql
-- Check customer phone numbers
SELECT name, phone FROM customers LIMIT 10;
```

Phone should be:
- ✅ `0712345678` (will be converted to +254712345678)
- ✅ `+254712345678`
- ✅ `254712345678`
- ❌ `712345678` (missing leading 0 or country code)

**Check 4: Africa's Talking Balance**
- Login to Africa's Talking dashboard
- Check SMS balance
- Verify Sender ID "NYLAWIGS" is approved

---

## 📱 Test Mode

To test without sending real SMS:

### Enable Test Mode:
```
# In .env.local and Vercel
SMS_TEST_MODE=true
```

This will:
- Log messages to console
- Save to database
- NOT send real SMS
- NOT charge your account

### Disable Test Mode (for production):
```
SMS_TEST_MODE=false
```

---

## 🎯 Quick Test Commands

### Test 1: Check if API key is set
```bash
# In Vercel Function Logs, you should see:
"Sending SMS to +254..."
NOT "API key missing"
```

### Test 2: Check message was queued
```sql
SELECT COUNT(*) FROM message_queue 
WHERE created_at > NOW() - INTERVAL '5 minutes';
```

Should return > 0 if you just sent a message

### Test 3: Check for errors
```sql
SELECT error_message, COUNT(*) 
FROM message_queue 
WHERE status = 'failed'
GROUP BY error_message;
```

---

## ✅ Expected Flow

### When You Send Message:

**1. Frontend (Customer Messages page)**
```
User clicks "Send" 
→ Calls /api/sms/send-manual
```

**2. API (/api/sms/send-manual.ts)**
```
Receives request
→ Gets customer data
→ Calls smsService.sendSMS()
```

**3. SMS Service (services/sms.service.ts)**
```
Gets API key from process.env.AFRICASTALKING_API_KEY
→ Formats phone number (+254...)
→ Calls Africa's Talking API
→ Saves to message_queue table
→ Returns success/failure
```

**4. Africa's Talking**
```
Receives SMS request
→ Sends to customer's phone
→ Returns delivery status
```

**5. Customer**
```
Receives SMS! 📱
```

---

## 🔑 Environment Variables Checklist

Make sure these are set in **BOTH** places:

### Local (.env.local):
- [x] AFRICASTALKING_API_KEY
- [x] AFRICASTALKING_USERNAME
- [x] AFRICASTALKING_SENDER_ID
- [x] SMS_TEST_MODE

### Vercel (Production):
- [ ] AFRICASTALKING_API_KEY
- [ ] AFRICASTALKING_USERNAME
- [ ] AFRICASTALKING_SENDER_ID
- [ ] SMS_TEST_MODE

**To add in Vercel:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable
5. Redeploy

---

## 📊 Monitor SMS Usage

### Check Total Sent:
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
  SUM(cost) as total_cost
FROM message_queue
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;
```

### Check Per Customer:
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

## 🎉 Summary

**What's Fixed:**
1. ✅ SMS service uses environment variables
2. ✅ UUID customer IDs supported
3. ✅ Better error handling
4. ✅ Diagnostic tools added

**Next Steps:**
1. Verify environment variables in Vercel
2. Run diagnostic SQL
3. Send test message
4. Check customer's phone

**The system is ready! Try sending a message now.** 📱
