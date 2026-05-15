// Direct Mobitech SMS Test
const fetch = require('node-fetch');

const API_KEY = 'REDACTED_APP_SECRET';
const PHONE = '254789715533'; // Your Airtel number
const MESSAGE = 'Test from Nyla Wigs - Direct API call';

async function testMobitech() {
  console.log('Testing Mobitech SMS API...');
  console.log('Phone:', PHONE);
  console.log('Message:', MESSAGE);
  console.log('API Key:', API_KEY.substring(0, 20) + '...');
  
  try {
    const response = await fetch('https://api.mobitechtechnologies.com/sms/sendsms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        mobile: PHONE,
        response_type: 'json',
        sender_name: 'NYLAWIGS',
        service_id: 0,
        message: MESSAGE,
        apikey: API_KEY
      })
    });

    const result = await response.json();
    
    console.log('\n=== RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success || result.status === 'success') {
      console.log('\n✅ SUCCESS! SMS should arrive shortly.');
    } else {
      console.log('\n❌ FAILED:', result.message || result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testMobitech();
