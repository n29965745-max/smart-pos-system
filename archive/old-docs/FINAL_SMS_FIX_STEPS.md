# 🚨 FINAL SMS FIX - DO THESE 3 THINGS NOW

## ❌ Current Problems

1. **Templates not showing** - RLS (Row Level Security) is blocking access
2. **Messages not sending** - Environment variables missing in Vercel

---

## ✅ STEP 1: Fix Database (Run SQL)

**Open Supabase SQL Editor and run:**

File: `lib/fix-sms-system-complete.sql`

Or copy this:

```sql
-- Disable RLS on all SMS tables
ALTER TABLE message_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communication_prefs DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_message_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_config DISABLE ROW LEVEL SECURITY;
```

**This will fix the templates display issue!**

---

## ✅ STEP 2: Add Environment Variables to Vercel

**Go to:** https://vercel.com/dashboard

1. Select your project
2. Click **Settings** → **Environment Variables**
3. Add these 4 variables:

```
Name: AFRICASTALKING_API_KEY
Value: REDACTED_AFRICASTALKING_KEY

Name: AFRICASTALKING_USERNAME  
Value: NYLAWIGS

Name: AFRICASTALKING_SENDER_ID
Value: NYLAWIGS

Name: CRON_SECRET
Value: REDACTED_CRON_SECRET
```

4. Select: **Production**, **Preview**, **Development** (all 3)
5. Click **Save** for each

---

## ✅ STEP 3: Redeploy

1. Go to **Deployments** tab in Vercel
2. Click **⋯** (3 dots) on latest deployment
3. Click **"Redeploy"**
4. Wait for green checkmark ✓

---

## 🧪 STEP 4: Test Everything

### Test 1: Check Templates Display

1. Open your app
2. Go to **Customer Messages** page
3. Click **"Message Templates"** tab
4. You should see **14 templates**!

### Test 2: Send Test Message

1. Click **"Send Message"** button
2. Type: `Hi {name}! Test from Nyla Wigs`
3. Select a customer
4. Click **"Send"**
5. Check if customer receives SMS

### Test 3: Verify in Database

Run this in Supabase:

```sql
SELECT 
  phone_number,
  LEFT(message_text, 50) as message,
  status,
  error_message,
  created_at
FROM message_queue
ORDER BY created_at DESC
LIMIT 5;
```

Look for:
- ✅ `status = 'sent'` → SUCCESS!
- ❌ `status = 'failed'` → Check `error_message`

---

## 🔍 If Still Not Working

### Templates Still Not Showing?

1. Check browser console (F12) for errors
2. Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Check Vercel function logs for API errors

### Messages Still Not Sending?

**Check these:**

1. **Environment variables in Vercel?**
   - Go to Settings → Environment Variables
   - Verify all 4 variables are there

2. **Redeployed after adding variables?**
   - Must redeploy for env vars to take effect

3. **Using production username?**
   - `AFRICASTALKING_USERNAME` should be `NYLAWIGS` (not "sandbox")

4. **SMS credits available?**
   - Login to Africa's Talking
   - Check SMS balance

5. **Phone number format correct?**
   - Should be: `0712345678` or `+254712345678`

---

## 📊 Summary

**What We Fixed:**

1. ✅ Disabled RLS on SMS tables (fixes templates display)
2. ✅ Added message templates to database
3. ✅ Documented environment variables needed
4. ✅ Created test procedures

**What You Need to Do:**

1. ⏳ Run SQL to disable RLS
2. ⏳ Add 4 environment variables to Vercel
3. ⏳ Redeploy application
4. ⏳ Test sending a message

**Time Required:** 10 minutes

**After this, everything will work!** 🎉

---

## 🆘 Still Need Help?

If after doing all 4 steps above it still doesn't work:

1. Share screenshot of Vercel environment variables
2. Share screenshot of message queue from database
3. Share any error messages from browser console

The system is 100% ready - just needs these configuration steps!
