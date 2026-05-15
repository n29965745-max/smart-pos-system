// Test Africa's Talking Account Status and Send Test SMS
const fetch = require('node-fetch');

const AFRICASTALKING_USERNAME = 'NYLAWIGS';
const AFRICASTALKING_API_KEY=REDACTED

async function checkBalance() {
  console.log('\n📊 Checking Account Balance...\n');
  
  try {
    const response = await fetch('https://api.africastalking.com/version1/user?username=' + AFRICASTALKING_USERNAME, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'apiKey': AFRICASTALKING_API_KEY
      }
    });

    const result = await response.json();
    console.log('Account Status:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Error checking balance:', error.message);
    return null;
  }
}

async function sendTestSMS(phoneNumber, message) {
  console.log('\n📱 Sending Test SMS...\n');
  console.log('To:', phoneNumber);
  console.log('Message:', message);
  console.log('');

  try {
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'apiKey': AFRICASTALKING_API_KEY
      },
      body: new URLSearchParams({
        username: AFRICASTALKING_USERNAME,
        to: phoneNumber,
        message: message,
        from: 'NYLAWIGS'
      })
    });

    const result = await response.json();
    console.log('SMS Response:', JSON.stringify(result, null, 2));

    const recipient = result.SMSMessageData?.Recipients?.[0];
    if (recipient) {
      console.log('\n📋 Result Summary:');
      console.log('Status:', recipient.status);
      console.log('Status Code:', recipient.statusCode);
      console.log('Message ID:', recipient.messageId);
      console.log('Cost:', recipient.cost);

      if (recipient.status === 'Success') {
        console.log('\n✅ SMS SENT SUCCESSFULLY!');
        console.log('The message should arrive within seconds.');
      } else {
        console.log('\n❌ SMS FAILED');
        console.log('Reason:', recipient.status);
        
        if (recipient.status === 'UserInBlacklist') {
          console.log('\n⚠️  BLACKLIST ISSUE:');
          console.log('This number has opted out of promotional messages.');
          console.log('');
          console.log('Solution:');
          console.log('1. The subscriber must dial: *456*9#');
          console.log('2. Select Option 5 – Marketing messages');
          console.log('3. Choose Option 5 – Activate all promo messages');
          console.log('');
          console.log('This is controlled by the subscriber, not your dashboard.');
        }
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Africa\'s Talking SMS Test\n');
  console.log('Account:', AFRICASTALKING_USERNAME);
  console.log('API Key:', AFRICASTALKING_API_KEY.substring(0, 20) + '...');
  console.log('');

  // Check balance first
  await checkBalance();

  // Get phone number from command line or use default
  const phoneNumber = process.argv[2] || '254743794815';
  const message = process.argv[3] || 'Test message from Nyla Wigs. Your SMS system is working! Reply STOP to opt out.';

  // Send test SMS
  await sendTestSMS(phoneNumber, message);

  console.log('\n✅ Test Complete\n');
  console.log('Usage: node test-africastalking-status.js [phone_number] [message]');
  console.log('Example: node test-africastalking-status.js 254712345678 "Hello from Nyla Wigs"');
}

main();
