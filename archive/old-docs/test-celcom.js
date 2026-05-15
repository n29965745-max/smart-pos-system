// Test Celcom Africa SMS Integration
// Run with: node test-celcom.js

const axios = require('axios');

// REPLACE THESE WITH YOUR ACTUAL CREDENTIALS FROM CELCOM DASHBOARD
const CELCOM_API_KEY=REDACTED
const CELCOM_PARTNER_ID = 'YOUR_PARTNER_ID_HERE';
const CELCOM_SENDER_ID = 'INFOTEXT'; // Use INFOTEXT until NYLAWIGS is approved

// REPLACE WITH YOUR TEST PHONE NUMBER (any network: Safaricom, Airtel, Telkom)
const TEST_PHONE = '254712345678'; // Format: 254XXXXXXXXX

async function testCelcomSMS() {
  try {
    console.log('🚀 Testing Celcom Africa SMS Integration\n');
    console.log('Configuration:');
    console.log('- API Key:', CELCOM_API_KEY.substring(0, 10) + '...');
    console.log('- Partner ID:', CELCOM_PARTNER_ID);
    console.log('- Sender ID:', CELCOM_SENDER_ID);
    console.log('- Test Phone:', TEST_PHONE);
    console.log('\n📤 Sending test message...\n');

    const response = await axios.post('https://isms.celcomafrica.com/api/services/sendsms/', {
      partnerID: CELCOM_PARTNER_ID,
      apikey: CELCOM_API_KEY,
      mobile: TEST_PHONE,
      message: 'Test message from Nyla Wigs POS System. Your SMS integration is working perfectly! 🎉',
      shortcode: CELCOM_SENDER_ID,
      pass_type: 'plain'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ SUCCESS! Message sent!\n');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.responses && response.data.responses.length > 0) {
      const result = response.data.responses[0];
      
      if (result['respose-code'] === 200) {
        console.log('\n🎉 Message delivered successfully!');
        console.log('Message ID:', result.messageid);
        console.log('Network ID:', result.networkid);
        console.log('\n✅ Your Celcom Africa integration is working!');
        console.log('✅ You can now send SMS to any Kenyan number!');
        console.log('✅ Check the phone', TEST_PHONE, 'for the message!');
      } else {
        console.log('\n❌ Message failed:');
        console.log('Error Code:', result['respose-code']);
        console.log('Error:', result['response-description']);
        console.log('\nCommon issues:');
        console.log('- 1004: Low bulk credits - add credit to your account');
        console.log('- 1006: Invalid credentials - check API key and Partner ID');
        console.log('- 1001: Invalid sender id - use INFOTEXT temporarily');
      }
    }

  } catch (error) {
    console.error('\n❌ Error sending SMS:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that API Key and Partner ID are correct');
    console.log('2. Ensure your Celcom account has credit');
    console.log('3. Verify phone number format: 254XXXXXXXXX');
    console.log('4. Make sure axios is installed: npm install axios');
  }
}

// Check if credentials are set
if (CELCOM_API_KEY=REDACTED 'YOUR_API_KEY_HERE' || CELCOM_PARTNER_ID === 'YOUR_PARTNER_ID_HERE') {
  console.log('❌ ERROR: Please update the credentials in this file first!');
  console.log('\n📝 Steps:');
  console.log('1. Open test-celcom.js in your editor');
  console.log('2. Replace YOUR_API_KEY_HERE with your actual API key');
  console.log('3. Replace YOUR_PARTNER_ID_HERE with your actual Partner ID');
  console.log('4. Replace 254712345678 with your test phone number');
  console.log('5. Run: node test-celcom.js');
  process.exit(1);
}

testCelcomSMS();
