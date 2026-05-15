// Activate Africa's Talking Account using Sandbox API
// This will verify your account automatically
const fetch = require('node-fetch');

const API_KEY = 'REDACTED_AFRICASTALKING_KEY';
const USERNAME = 'NYLAWIGS';
const PHONE = '+254743794815';

console.log('🚀 Activating Africa\'s Talking Account via Sandbox\n');
console.log('Username:', USERNAME);
console.log('Phone:', PHONE);
console.log('API Key:', API_KEY.substring(0, 20) + '...\n');

async function activateAccount() {
  console.log('📱 Sending SMS via SANDBOX endpoint...');
  console.log('This will activate your account automatically!\n');

  try {
    const response = await fetch('https://api.sandbox.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'apiKey': API_KEY
      },
      body: new URLSearchParams({
        username: USERNAME,
        to: PHONE,
        message: 'Account activation test from Nyla Wigs POS System. Your SMS system is being activated!',
        from: 'NYLAWIGS'
      })
    });

    const result = await response.json();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response:', JSON.stringify(result, null, 2));
    console.log('');

    if (response.ok && result.SMSMessageData) {
      const recipients = result.SMSMessageData.Recipients;
      if (recipients && recipients.length > 0) {
        const recipient = recipients[0];
        console.log('📊 Status:', recipient.status);
        console.log('💰 Cost:', recipient.cost);
        console.log('🆔 Message ID:', recipient.messageId);
        console.log('');

        if (recipient.status === 'Success' || recipient.statusCode === 101) {
          console.log('🎉 SUCCESS! Your account is now ACTIVATED!');
          console.log('📱 Check your phone for the test message');
          console.log('');
          console.log('✅ Next Steps:');
          console.log('1. Your account is now verified');
          console.log('2. You can now use the PRODUCTION API');
          console.log('3. Add credit to your account');
          console.log('4. Start sending real SMS!');
          console.log('');
          console.log('Run this to test production:');
          console.log('node test-africastalking-fresh.js');
        } else {
          console.log('⚠️ Status:', recipient.status);
          console.log('Status Code:', recipient.statusCode);
        }
      }
    } else {
      console.log('❌ Activation failed');
      console.log('');
      
      if (response.status === 401) {
        console.log('🔑 Authentication issue:');
        console.log('- Check your API key is correct');
        console.log('- Make sure you copied the entire key');
        console.log('- Try generating a new API key');
      } else {
        console.log('Error details:', result);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Full error:', error);
  }
}

activateAccount();
