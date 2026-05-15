// Test Mobitech SMS WITHOUT custom sender name
// This will help diagnose if the problem is:
// 1. API key not activated (will still fail)
// 2. FULL_CIRCLE not approved (will succeed with default sender)

const fetch = require('node-fetch');

const MOBITECH_API_KEY=REDACTED
const MOBITECH_URL = 'https://api.mobitechtechnologies.com/sms/sendsms';

async function testMobitechNoSender() {
  console.log('🧪 Testing Mobitech SMS WITHOUT custom sender name...\n');
  console.log('This test will help us understand if:');
  console.log('- API key is activated (test will succeed)');
  console.log('- OR API key is not activated (test will fail)\n');
  
  const testPhone = '254743794815'; // Your number
  const testMessage = 'Test from Mobitech: Testing API key without custom sender name. If you receive this, the API key works!';

  console.log('📱 Sending to:', testPhone);
  console.log('💬 Message:', testMessage);
  console.log('📤 Sender: (default - no custom sender)');
  console.log('🔑 API Key:', MOBITECH_API_KEY.substring(0, 20) + '...\n');

  try {
    // Test WITHOUT sender_name parameter
    const response = await fetch(MOBITECH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        mobile: testPhone,
        response_type: 'json',
        service_id: 0,
        message: testMessage,
        apikey: MOBITECH_API_KEY
        // NOTE: No sender_name parameter
      })
    });

    const result = await response.json();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response:', JSON.stringify(result, null, 2));
    
    if (result.success === true || result.status === 'success' || result[0]?.status_code === '1000') {
      console.log('\n✅ SUCCESS! API key works!');
      console.log('📱 Check your phone (0743794815) for the message');
      console.log('\n🔍 DIAGNOSIS:');
      console.log('✅ API key is activated');
      console.log('❌ Problem is with FULL_CIRCLE sender name approval');
      console.log('\n📞 Tell Mobitech:');
      console.log('"My API key works with default sender, but I need FULL_CIRCLE approved and linked to my account MT6896"');
    } else if (result[0]?.status_code === '1006') {
      console.log('\n❌ FAILED: Error 1006 - Invalid credentials');
      console.log('\n🔍 DIAGNOSIS:');
      console.log('❌ API key is NOT activated in Mobitech system');
      console.log('❌ This is not about the sender name');
      console.log('\n📞 Tell Mobitech:');
      console.log('"My API key REDACTED_APP_SECRET is not activated. Please activate it for account MT6896"');
    } else {
      console.log('\n❌ FAILED:', result.message || result[0]?.status_desc || 'Unknown error');
      console.log('\n🔍 Response details:', result);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testMobitechNoSender();
