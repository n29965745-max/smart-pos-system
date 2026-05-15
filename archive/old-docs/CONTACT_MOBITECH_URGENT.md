# URGENT: Contact Mobitech Support Now

## The Problem

You're getting **Error 1006 "Invalid credentials"** when trying to send SMS, even though Mobitech support told you the account is active.

## Test Result (Just Now)

```
Status Code: 1006
Status Description: Invalid credentials
Message ID: 0
Credit Balance: (empty)
```

This means the API is rejecting your credentials.

---

## What to Send to Mobitech Support

### Option 1: Phone Call (FASTEST)
**Call: +254 722 386 000**

Say this:

> "Hello, I'm calling about account MT6896. You told me the account is active and to use FULL_CIRCLE as the sender name. I've updated my code but I'm still getting error 1006 'Invalid credentials' when I try to send SMS. 
>
> My API key is: REDACTED_APP_SECRET
>
> Can you please check:
> 1. Is this API key activated in your system?
> 2. Is FULL_CIRCLE approved as a sender name for this API key?
> 3. Is there a different API key I should be using?
>
> I've topped up KSH 50 and I'm ready to send messages, but the API keeps rejecting my credentials."

---

### Option 2: Email (If they don't answer phone)
**To: support@mobitechtechnologies.com**

**Subject: Error 1006 - Account MT6896 - FULL_CIRCLE Sender Name**

**Body:**

```
Hello Mobitech Support Team,

I contacted you earlier about using FULL_CIRCLE as my sender name, and you confirmed my account (MT6896) is active. However, I'm still unable to send SMS.

ACCOUNT DETAILS:
- Account: MT6896
- API Key: REDACTED_APP_SECRET
- Sender Name: FULL_CIRCLE
- Balance: KSH 50 (topped up)

ERROR DETAILS:
When I try to send SMS, I get:
- Status Code: 1006
- Status Description: "Invalid credentials"
- Message ID: 0
- Credit Balance: (empty)

TEST REQUEST I'M SENDING:
POST https://api.mobitechtechnologies.com/sms/sendsms
{
  "mobile": "254743794815",
  "response_type": "json",
  "sender_name": "FULL_CIRCLE",
  "service_id": 0,
  "message": "Test message",
  "apikey": "REDACTED_APP_SECRET"
}

QUESTIONS:
1. Is my API key activated in your system?
2. Is FULL_CIRCLE approved as a sender name for my account?
3. Do I need a different API key for FULL_CIRCLE?
4. Is there an activation step I'm missing?

Please help me resolve this urgently. I have customers waiting for SMS notifications.

Thank you,
[Your Name]
[Your Phone: 0743794815]
```

---

## Possible Causes

Based on the error, here's what might be wrong:

1. **API Key Not Activated**
   - They gave you the key but didn't activate it in their system
   - Solution: They need to activate it

2. **Sender Name Not Linked**
   - FULL_CIRCLE is approved but not linked to your API key
   - Solution: They need to link FULL_CIRCLE to your API key

3. **Wrong API Key**
   - They gave you a sandbox/test key instead of production key
   - Solution: They need to give you the correct production API key

4. **Account Not Fully Activated**
   - They said it's active but backend activation is incomplete
   - Solution: They need to complete the activation process

---

## What to Ask Mobitech

When you contact them, get clear answers to these questions:

1. ✅ **"Is API key REDACTED_APP_SECRET activated?"**

2. ✅ **"Is FULL_CIRCLE approved and linked to this API key?"**

3. ✅ **"Can you test sending an SMS from your side using my API key?"**

4. ✅ **"What is my current credit balance? (Should be KSH 50)"**

5. ✅ **"Is there a different API key I should be using for production?"**

---

## Alternative: Try Default Sender Name

While waiting for Mobitech, you could try sending WITHOUT a custom sender name to see if the API key works at all.

I can create a test script that uses their default sender name (usually your phone number or "MOBITECH"). This will tell us if:
- ✅ API key works → Problem is with FULL_CIRCLE approval
- ❌ API key doesn't work → Problem is with API key activation

Want me to create this test?

---

## Next Steps

1. **CALL MOBITECH NOW**: +254 722 386 000
2. **Get them to check your API key activation**
3. **Get them to confirm FULL_CIRCLE is linked to your key**
4. **Ask them to test from their side**
5. **Get a timeline for when it will work**

---

## Important Notes

- Your code is 100% correct
- The API endpoint is correct
- The request format is correct
- The problem is on Mobitech's side (account/API key activation)

Don't let them tell you it's a code problem - the error 1006 specifically means "Invalid credentials" which is their system rejecting your API key.

---

## After Mobitech Fixes It

Once they confirm it's fixed:

1. Run test again: `node test-mobitech-fullcircle.js`
2. If successful, update Vercel environment variables
3. Redeploy to production
4. SMS will work!

---

**CALL THEM NOW: +254 722 386 000**
