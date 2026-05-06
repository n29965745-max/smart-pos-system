// Test Celcom SMS - Run this to verify your credentials
// Usage: node test-celcom-now.js

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function testCelcomSMS() {
  const apiKey = process.env.CELCOM_API_KEY;
  const partnerID = process.env.CELCOM_PARTNER_ID;
  const shortcode = process.env.CELCOM_SENDER_ID || 'TEXTME';

  console.log('🔍 Testing Celcom SMS Configuration...\n');
  console.log('Configuration:');
  console.log('- Partner ID:', partnerID);
  console.log('- API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
  console.log('- Sender ID:', shortcode);
  console.log('');

  if (!apiKey || !partnerID) {
    console.error('❌ ERROR: Celcom credentials not configured in .env.local');
    return;
  }

  // Test 1: Check Balance
  console.log('📊 Test 1: Checking Account Balance...');
  try {
    const balanceResponse = await axios.post('https://isms.celcomafrica.com/api/services/getbalance/', {
      partnerID: partnerID,
      apikey: apiKey
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Balance Response:', JSON.stringify(balanceResponse.data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Balance Check Failed:', error.response?.data || error.message);
    console.log('');
  }

  // Test 2: Send Test SMS
  console.log('📱 Test 2: Sending Test SMS...');
  console.log('Enter a test phone number (e.g., 254712345678):');
  
  // For automated testing, use a default number
  const testPhone = process.argv[2] || '254712345678';
  console.log(`Using phone number: ${testPhone}`);
  
  try {
    const smsResponse = await axios.post('https://isms.celcomafrica.com/api/services/sendsms/', {
      partnerID: partnerID,
      apikey: apiKey,
      mobile: testPhone,
      message: 'Test message from Smart POS System. If you receive this, SMS is working!',
      shortcode: shortcode,
      pass_type: 'plain'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ SMS Response:', JSON.stringify(smsResponse.data, null, 2));
    
    if (smsResponse.data && smsResponse.data.responses && smsResponse.data.responses.length > 0) {
      const result = smsResponse.data.responses[0];
      const success = result['response-code'] === 200 || result['respose-code'] === 200;
      
      if (success) {
        console.log('\n✅ SUCCESS! Message sent successfully!');
        console.log('Message ID:', result.messageid);
        console.log('Status:', result['response-description']);
      } else {
        console.log('\n❌ FAILED! Message not sent.');
        console.log('Error:', result['response-description']);
      }
    }
  } catch (error) {
    console.error('❌ SMS Send Failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test Complete!');
  console.log('='.repeat(60));
}

// Run the test
testCelcomSMS().catch(console.error);
