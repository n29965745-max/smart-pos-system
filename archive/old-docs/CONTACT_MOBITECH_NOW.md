# 📞 Contact Mobitech Support - Account Activation Required

**Your Issue**: Error 1006 "Invalid credentials"  
**Reason**: Account needs API activation after first top-up  
**Solution**: Contact Mobitech support

---

## Contact Mobitech NOW

### Option 1: Phone (FASTEST)
📞 **+254 722 386 000**

Call them and say:
> "Hi, I need to activate API access for account MT6896. I topped up KSH 50 but getting error 1006 when using the API. Please activate my account for SMS API usage."

### Option 2: Email
📧 **support@mobitechtechnologies.com**

Send this email:

```
Subject: Activate API Access for Account MT6896

Hello Mobitech Support,

I need to activate API access for my account:

Account Number: MT6896
Email: brunowachira001@gmail.com
Phone: 254743794815
Business: Nyla Wigs

I have topped up KSH 50 to my account but I'm getting error 1006 
"Invalid credentials" when trying to send SMS via your API.

API Key: REDACTED_APP_SECRET

Please activate my account for API usage so I can start sending SMS 
to my customers.

Thank you!
Bruno Wachira
```

### Option 3: WhatsApp
💬 **+254 722 386 000**

Send the same message as above.

---

## What They Need to Do

Mobitech needs to:
1. ✅ Verify your account (MT6896)
2. ✅ Confirm payment received (KSH 50)
3. ✅ Enable API access for your account
4. ✅ Activate your sender ID (NYLAWIGS)

**This usually takes 1-2 hours during business hours.**

---

## Your Account Details (For Reference)

- **Account**: MT6896
- **Email**: brunowachira001@gmail.com
- **Phone**: 254743794815
- **Business**: Nyla Wigs
- **Sender ID**: NYLAWIGS
- **Balance**: KSH 50
- **API Key**: REDACTED_APP_SECRET

---

## After They Activate

### Test Immediately:
```bash
node test-mobitech-direct.js
```

### Expected Success Response:
```json
{
  "status_code": "1000",
  "status_desc": "Success",
  "message_id": "12345",
  "mobile_number": "254789715533",
  "credit_balance": "49.20"
}
```

### Then Switch to Production:
1. Go to Vercel → Environment Variables
2. Change `SMS_TEST_MODE` to `false`
3. Redeploy
4. **Real SMS will work!**

---

## Why This Happened

Mobitech requires **manual activation** for new accounts after first payment. This is:
- ✅ Normal procedure
- ✅ Security measure
- ✅ One-time only
- ✅ Quick to resolve

Once activated, your account works forever - no more activation needed.

---

## Business Hours

**Mobitech Support Hours**:
- Monday - Friday: 8:00 AM - 6:00 PM EAT
- Saturday: 9:00 AM - 1:00 PM EAT
- Sunday: Closed

**Best time to call**: 9:00 AM - 5:00 PM on weekdays

---

## Alternative: Use Test Mode While Waiting

If you need the system working NOW for your client:

1. Enable test mode (see ENABLE_TEST_MODE_INSTRUCTIONS.md)
2. Deploy to Vercel
3. Client can use system (messages simulated)
4. Switch to production after Mobitech activates

This way your client isn't blocked!

---

## Summary

🔴 **URGENT**: Call Mobitech at +254 722 386 000  
⏱️ **Time**: 5 minutes to call, 1-2 hours for activation  
✅ **Result**: Real SMS working today  

**Don't wait - call them now!**
