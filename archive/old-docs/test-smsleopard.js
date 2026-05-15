// Test SMS Leopard Integration
require('dotenv').config({ path: '.env.local' });

const SMSLEOPARD_ACCESS_TOKEN=REDACTED
const SMSLEOPARD_SENDER_ID = process.env.SMSLEOPARD_SENDER_ID || 'NYLAWIGS';

async function testSMSLeopard() {
  console.log('🧪 Testing SMS Leopard Integration...\n');

  // Check credentials
  if (!SMSLEOPARD_ACCESS_TOKEN) {
    console.log('❌ ERROR: SMS Leopard access token not found in .env.local\n');
    console.log('Please add these to your .env.local file:');
    console.log(SMSLEOPARD_ACCESS_TOKEN=REDACTED);
    console.log('SMSLEOPARD_SENDER_ID="NYLAWIGS"');
    console.log('\nGet your access token from: https://app.smsleopard.com/api-keys');
    return;
  }

  console.log('✅ Credentials found:');
  console.log('   Access Token:', SMSLEOPARD_ACCESS_TOKEN.substring(0, 20) + '...');
  console.log('   Sender ID:', SMSLEOPARD_SENDER_ID);
  console.log('');

  const testPhone = '254743794815'; // Your phone number
  const testMessage = `Hello from ${SMSLEOPARD_SENDER_ID}! 🎉 Your SMS system is now working with SMS Leopard. Cost: Only KSH 0.80 per message!`;

  console.log('📱 Sending to:', testPhone);
  console.log('💬 Message:', testMessage);
  console.log('📤 Sender:', SMSLEOPARD_SENDER_ID);
  console.log('💰 Cost: KSH 0.80');
  console.log('');

  try {
    const fetch = (await import('node-fetch')).default;
    
    // SMS Leopard API v1 format
    const response = await fetch('https://api.smsleopard.com/v1/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${SMSLEOPARD_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        message: testMessage,
        recipients: [
          {
            phone_number: testPhone
          }
        ],
        sender_name: SMSLEOPARD_SENDER_ID
      })
    });

    const result = await response.json();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response:', JSON.stringify(result, null, 2));
    console.log('');

    if (result.success === true && response.ok) {
      console.log('✅ SUCCESS! SMS sent via SMS Leopard');
      console.log('📱 Check your phone (0743794815) for the message');
      console.log('');
      console.log('📊 Message Details:');
      console.log('   Status: Sent');
      console.log('   Cost: KSH 0.80');
      console.log('   Sender:', SMSLEOPARD_SENDER_ID);
      console.log('   Destination:', testPhone);
      console.log('');
      console.log('🎉 Your SMS system is ready!');
      console.log('');
      console.log('💰 Cost Comparison:');
      console.log('   SMS Leopard: KSH 0.80/SMS');
      console.log('   Twilio: KSH 6.50/SMS');
      console.log('   You save: KSH 5.70 per SMS!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Update Vercel environment variables');
      console.log('2. Set SMS_PROVIDER=smsleopard in Vercel');
      console.log('3. Deploy to production');
      console.log('4. Start sending SMS to customers!');
    } else {
      console.log('❌ FAILED:', result.message || result.error || 'Unknown error');
      console.log('');
      
      if (result.message && result.message.includes('authentication')) {
        console.log('⚠️  Authentication Error');
        console.log('');
        console.log('Solutions:');
        console.log('1. Check your API key is correct');
        console.log('2. Get it from: https://www.smsleopard.com/dashboard');
        console.log('3. Make sure it starts with "slk_"');
        console.log('4. Ensure no extra spaces in .env.local');
      } else if (result.message && result.message.includes('balance')) {
        console.log('⚠️  Insufficient Balance');
        console.log('');
        console.log('Solutions:');
        console.log('1. Top up your account at: https://www.smsleopard.com/billing');
        console.log('2. Minimum: KSH 100 (gets you 125 SMS)');
        console.log('3. Payment via M-Pesa or card');
      } else if (result.message && result.message.includes('sender')) {
        console.log('⚠️  Sender ID Not Approved');
        console.log('');
        console.log('Solutions:');
        console.log('1. Register sender ID at: https://www.smsleopard.com/sender-ids');
        console.log('2. Wait for approval (usually instant to 24 hours)');
        console.log('3. Or use default sender ID temporarily');
      } else {
        console.log('Error details:', result);
        console.log('');
        console.log('Troubleshooting:');
        console.log('1. Check your account status at: https://www.smsleopard.com/dashboard');
        console.log('2. Verify your credit balance');
        console.log('3. Ensure sender ID is approved');
        console.log('4. Contact support: support@smsleopard.com');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify SMS Leopard API is accessible');
    console.log('3. Make sure you have node-fetch installed: npm install node-fetch');
    console.log('4. Check .env.local file exists and has correct values');
  }
}

testSMSLeopard();
