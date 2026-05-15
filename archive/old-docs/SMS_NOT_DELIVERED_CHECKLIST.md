# SMS Not Delivered - Troubleshooting Checklist

## Issue
Customer didn't receive SMS message

## Quick Checks

### 1. Check Message Queue in Database
Run this SQL in Supabase:
```sql
SELECT 
  id,
  phone_number,
  message_text,
  status,
  error_message,
  sent_at,
  created_at
FROM message_queue
ORDER BY created_at DESC
LIMIT 10;
```

**Look for:**
- ✅ Status = 'sent' → Message was sent to Celcom
- ❌ Status = 'failed' → Check error_message column
- ⏳ Status = 'pending' → Message not sent yet

### 2. Verify Phone Number Format
Celcom requires: `254XXXXXXXXX` format

**Examples:**
- ✅ Correct: `254712345678`
- ❌ Wrong: `0712345678` (will be auto-converted)
- ❌ Wrong: `+254712345678` (will be auto-converted)
- ❌ Wrong: `712345678` (will be auto-converted)

### 3. Test Celcom API Directly
Run this command:
```bash
node test-celcom-now.js 254XXXXXXXXX
```

Replace `254XXXXXXXXX` with the customer's actual phone number.

This will:
- Check your Celcom account balance
- Send a test SMS
- Show you the exact API response

### 4. Check Celcom Account Balance
Your Celcom account might be out of credits.

**Check balance:**
1. Visit: https://isms.celcomafrica.com/
2. Login with your credentials
3. Check your SMS balance

OR run:
```bash
node test-celcom-now.js
```

### 5. Verify Environment Variables
Check that these are set in Vercel:
- `CELCOM_API_KEY` = `REDACTED_HEX_SECRET`
- `CELCOM_PARTNER_ID` = `36`
- `CELCOM_SENDER_ID` = `TEXTME`
- `SMS_PROVIDER` = `celcom`

## Common Issues

### Issue 1: Wrong Phone Number Format
**Symptom:** Message shows as 'sent' but customer doesn't receive it
**Solution:** Verify phone number is in correct format (254XXXXXXXXX)

### Issue 2: Insufficient Balance
**Symptom:** API returns error about insufficient credits
**Solution:** Top up your Celcom account

### Issue 3: Invalid Sender ID
**Symptom:** API rejects message with sender ID error
**Solution:** Use approved sender ID (TEXTME or your registered ID)

### Issue 4: Message Too Long
**Symptom:** Message truncated or not delivered
**Solution:** Keep messages under 160 characters (1 SMS)

### Issue 5: Network Delay
**Symptom:** Message sent but delayed delivery
**Solution:** Wait 1-5 minutes, check with customer

## Testing Steps

### Step 1: Send Test Message
1. Go to Customer Messages page
2. Select a customer
3. Choose a template
4. Click "Send Message"
5. Check browser console for errors

### Step 2: Check Database
Run the SQL query above to see if message was logged

### Step 3: Check Celcom Dashboard
Login to https://isms.celcomafrica.com/ and check:
- Account balance
- Message history
- Delivery reports

### Step 4: Test with Your Own Number
Send a test message to your own phone number to verify the system works

## If Still Not Working

### Option 1: Check Celcom API Status
Contact Celcom support:
- Email: support@celcomafrica.com
- Check if there are any service outages

### Option 2: Verify Customer's Phone
- Ask customer to confirm their phone number
- Try sending to a different number
- Check if customer's phone is on/has signal

### Option 3: Check Server Logs
In Vercel dashboard:
1. Go to your project
2. Click "Logs"
3. Look for SMS-related errors
4. Check for API failures

## Quick Test Command

Run this to test everything at once:
```bash
# Test with your phone number
node test-celcom-now.js 254712345678

# Check recent messages in database
# (Run the SQL query in Supabase)
```

## Expected Successful Response

When SMS is sent successfully, you should see:
```json
{
  "responses": [{
    "response-code": 200,
    "response-description": "Success",
    "messageid": "12345678"
  }]
}
```

## Need Help?

1. Run `node test-celcom-now.js YOUR_PHONE_NUMBER`
2. Check the SQL query results
3. Share the error message if any
