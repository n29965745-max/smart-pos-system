// Test Mobitech SMS with FULL_CIRCLE sender name
const fetch = require('node-fetch');

const MOBITECH_API_KEY=REDACTED
const MOBITECH_URL = 'https://api.mobitechtechnologies.com/sms/sendsms';

async function testMobitechSMS() {
  console.log('🧪 Testing Mobitech SMS with FULL_CIRCLE sender...\n');
  
  const testPhone = '254743794815'; // Your number
  const testMessage = 'Test from FULL_CIRCLE: Your Mobitech account is now active! This is a test message from your POS system.';

  console.log('📱 Sending to:', testPhone);
  console.log('💬 Message:', testMessage);
  console.log('📤 Sender:', 'FULL_CIRCLE');
  console.log('🔑 API Key:', MOBITECH_API_KEY.substring(0, 20) + '...\n');

  try {
    const response = await fetch(MOBITECH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        mobile: testPhone,
        response_type: 'json',
        sender_name: 'FULL_CIRCLE',
        service_id: 0,
        message: testMessage,
        apikey: MOBITECH_API_KEY
      })
    });

    const result = await response.json();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response:', JSON.stringify(result, null, 2));
    
    if (result.success === true || result.status === 'success') {
      console.log('\n✅ SUCCESS! SMS sent with FULL_CIRCLE sender name');
      console.log('📱 Check your phone (0743794815) for the message');
      console.log('👀 It should show "From: FULL_CIRCLE"');
    } else {
      console.log('\n❌ FAILED:', result.message || 'Unknown error');
      
      if (result.message && result.message.includes('1006')) {
        console.log('\n⚠️  Error 1006 = Account not activated yet');
        console.log('📞 Call Mobitech: +254 722 386 000');
        console.log('💬 Tell them: "I spoke to you about using FULL_CIRCLE sender name. Please complete the activation for account MT6896"');
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testMobitechSMS();
