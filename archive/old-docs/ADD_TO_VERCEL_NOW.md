# 🚀 ADD THESE TO VERCEL NOW

## Your API Key (Copy This):

```
REDACTED_AFRICASTALKING_KEY
```

---

## Step-by-Step Instructions:

### 1. Open Vercel Dashboard
Go to: **https://vercel.com/dashboard**

### 2. Select Your Project
Click on your **Nyla Wigs POS** project

### 3. Go to Settings
Click **Settings** in the top menu

### 4. Click Environment Variables
In the left sidebar, click **Environment Variables**

### 5. Add Variable #1
- Click **"Add New"** button
- **Name:** `AFRICASTALKING_API_KEY`
- **Value:** `REDACTED_AFRICASTALKING_KEY`
- Check: ✅ Production ✅ Preview ✅ Development
- Click **Save**

### 6. Add Variable #2
- Click **"Add New"** button
- **Name:** `AFRICASTALKING_USERNAME`
- **Value:** `sandbox`
- Check: ✅ Production ✅ Preview ✅ Development
- Click **Save**

### 7. Add Variable #3
- Click **"Add New"** button
- **Name:** `AFRICASTALKING_SENDER_ID`
- **Value:** `NYLAWIGS`
- Check: ✅ Production ✅ Preview ✅ Development
- Click **Save**

### 8. Add Variable #4
- Click **"Add New"** button
- **Name:** `CRON_SECRET`
- **Value:** `REDACTED_CRON_SECRET`
- Check: ✅ Production ✅ Preview ✅ Development
- Click **Save**

### 9. Redeploy
- Go to **Deployments** tab
- Find the latest deployment
- Click the **⋯** (three dots)
- Click **"Redeploy"**
- Wait for green checkmark ✓

### 10. Test
- Open your app
- Go to **Customer Messages**
- Click **"Send Message"**
- Send a test message

---

## ⚠️ IMPORTANT NOTE

**You are currently in SANDBOX MODE (test only)**

This means:
- ❌ Real customers will NOT receive messages
- ✅ Only registered test numbers will receive
- ✅ Good for testing the system

**To send REAL SMS to customers:**
1. Login to Africa's Talking
2. Get your **production username** (not "sandbox")
3. Go back to Vercel Environment Variables
4. Edit `AFRICASTALKING_USERNAME`
5. Change from `sandbox` to your production username
6. Redeploy

---

## ✅ Checklist

- [ ] Added `AFRICASTALKING_API_KEY` to Vercel
- [ ] Added `AFRICASTALKING_USERNAME` to Vercel
- [ ] Added `AFRICASTALKING_SENDER_ID` to Vercel
- [ ] Added `CRON_SECRET` to Vercel
- [ ] Selected Production, Preview, Development for all
- [ ] Redeployed the application
- [ ] Tested by sending a message

---

## 🔍 Verify It Worked

Run this in Supabase SQL Editor:

```sql
SELECT 
  phone_number,
  status,
  error_message,
  created_at
FROM message_queue
ORDER BY created_at DESC
LIMIT 5;
```

Look for `status = 'sent'` ✅

---

## Need Help?

See **SMS_TROUBLESHOOTING_GUIDE.md** for complete guide
