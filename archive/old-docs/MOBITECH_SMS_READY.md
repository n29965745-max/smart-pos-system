# ✅ Mobitech SMS Integration Complete!

## Your Mobitech Account Details

- **Company**: Nyla Wigs
- **Account Number**: MT6896
- **Phone**: 254743794815
- **Email**: brunowachira001@gmail.com
- **API Key**: `REDACTED_APP_SECRET`
- **Sender ID**: NYLAWIGS
- **Role**: Partner Admin

---

## ⚠️ IMPORTANT: Add Credit to Your Account

Your account balance is **0 KShs**. You need to add credit before sending SMS.

### How to Top Up via M-PESA:

1. **Go to M-PESA Menu** on your phone
2. **Select**: Lipa na M-PESA
3. **Select**: Pay Bill
4. **Enter Business Number**: `722232`
5. **Enter Account Number**: `MT6896`
6. **Enter Amount**: Start with KES 100-500
7. **Enter M-PESA PIN** and confirm

**OR** use the "Lipa Na M-PESA Online" button on your Mobitech dashboard.

---

## What I Just Did

✅ Created Mobitech SMS service (`services/mobitech-sms.service.ts`)
✅ Created Mobitech API endpoint (`pages/api/sms/send-mobitech.ts`)  
✅ Updated `.env.local` with your Mobitech credentials  
✅ Set `SMS_TEST_MODE="false"` (ready for production)  
✅ Configured sender ID as "NYLAWIGS"

---

## Next Steps

### 1. Add Mobitech Credentials to Vercel (REQUIRED)

Go to: https://vercel.com/dashboard

1. Select your project
2. Go to **Settings** → **Environment Variables**
3. **Add these variables**:

```
MOBITECH_API_KEY=REDACTED
MOBITECH_ACCOUNT = MT6896
MOBITECH_SENDER_ID = NYLAWIGS
SMS_PROVIDER = mobitech
SMS_TEST_MODE = false
```

4. **Remove or update** old Africa's Talking variables (optional):
   - You can leave them or remove them

5. Click **Save**

### 2. Deploy to Vercel

```bash
git add .
git commit -m "Integrate Mobitech SMS service"
git push origin main
```

Wait 2-3 minutes for deployment to complete.

### 3. Top Up Your Mobitech Account

- Add at least KES 100-500 to start
- Each SMS costs approximately KES 0.80
- 100 KES = ~125 SMS messages

### 4. Test SMS Sending

Once deployed and topped up:

1. Go to your app: https://your-app.vercel.app
2. Navigate to **Customer Messages**
3. Select a customer
4. Choose a template
5. Click **Send Message**
6. Check customer's phone for SMS!

---

## How It Works

### Automatic SMS (After Purchase):
- Customer makes a purchase in POS
- System waits 10 minutes
- Sends automated thank you message
- Uses template from database

### Manual SMS:
- Go to Customer Messages page
- Select customer
- Choose template or write custom message
- Click Send
- SMS sent immediately

### Bulk SMS:
- Select multiple customers
- Choose template
- Send to all at once

---

## SMS Pricing

- **Cost per SMS**: ~KES 0.80
- **No monthly fees**
- **Pay as you go**
- **Very affordable** for small businesses

Example costs:
- 100 messages = KES 80
- 500 messages = KES 400
- 1000 messages = KES 800

---

## Test Mode vs Production

### Currently: Production Mode (`SMS_TEST_MODE="false"`)
- Real SMS will be sent
- Costs apply
- Messages reach customer phones
- **Requires account credit**

### If You Want Test Mode:
Set `SMS_TEST_MODE="true"` in Vercel to:
- Simulate SMS sending
- No costs
- Messages logged but not sent
- Good for testing

---

## Troubleshooting

### "Insufficient balance" error:
- Top up your Mobitech account via M-PESA
- Check balance on Mobitech dashboard

### "Invalid API key" error:
- Verify API key in Vercel matches: `REDACTED_APP_SECRET`
- Redeploy after updating

### SMS not received:
- Check phone number format (should be 254XXXXXXXXX)
- Verify account has credit
- Check message queue in Customer Messages page
- Look for error messages

### "Sender ID not approved":
- NYLAWIGS should work immediately
- If issues, contact Mobitech support

---

## API Endpoints

### Send Manual SMS:
```
POST /api/sms/send-mobitech
Body: {
  "phoneNumber": "0789715533",
  "message": "Hello from Nyla Wigs!",
  "customerId": "uuid",
  "messageType": "manual"
}
```

### Send with Template:
```
POST /api/sms/send-mobitech
Body: {
  "phoneNumber": "0789715533",
  "customerId": "uuid",
  "templateId": 1,
  "messageType": "manual",
  "context": {
    "product_name": "Wig",
    "amount": "5000"
  }
}
```

---

## Support

### Mobitech Support:
- **Phone**: +254 722 386 000
- **Email**: support@mobitechtechnologies.com
- **Dashboard**: https://bulk.mobitechtechnologies.com

### Your Account:
- **Login**: brunowachira001@gmail.com
- **Account**: MT6896

---

## Summary

✅ Mobitech integration complete  
✅ API credentials configured  
⏳ **NEXT**: Add credentials to Vercel  
⏳ **NEXT**: Top up account (KES 100-500)  
⏳ **NEXT**: Deploy and test  

**You're ONE deployment away from sending real SMS!**

Once you:
1. Add environment variables to Vercel
2. Deploy
3. Top up your account

Your SMS system will be LIVE and sending real messages to customers!

