/**
 * Test Celcom Africa SMS with real credentials
 * Run: node test-celcom-live.js <phone_number>
 * Example: node test-celcom-live.js 0712345678
 */

const axios = require('axios');

const API_KEY = '0621e4ea38a9d2b9000c97c90bf40c97';
const PARTNER_ID = '36';
const SHORTCODE = 'TEXTME';
const API_URL = 'https://isms.celcomafrica.com/api/services/sendsms/';

// Get phone from command line or use default test number
const rawPhone = process.argv[2] || '0712345678';

// Format phone number
function formatPhone(phone) {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  if (!cleaned.startsWith('254')) cleaned = '254' + cleaned;
  return cleaned;
}

const phone = formatPhone(rawPhone);

async function testSMS() {
  console.log('=== Celcom Africa SMS Test ===');
  console.log('API Key:', API_KEY.substring(0, 8) + '...');
  console.log('Partner ID:', PARTNER_ID);
  console.log('Shortcode:', SHORTCODE);
  console.log('Sending to:', phone);
  console.log('');

  try {
    const payload = {
      partnerID: PARTNER_ID,
      apikey: API_KEY,
      mobile: phone,
      message: 'Test message from SmartPOS system. Celcom Africa integration is working!',
      shortcode: SHORTCODE,
      pass_type: 'plain'
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('');

    const response = await axios.post(API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    if (response.data?.responses?.[0]) {
      const result = response.data.responses[0];
      const success = result['respose-code'] === 200 || result['response-code'] === 200;
      console.log('');
      console.log(success ? '✅ SMS SENT SUCCESSFULLY!' : '❌ SMS FAILED');
      console.log('Message ID:', result.messageid);
      console.log('Status:', result['response-description'] || result['respose-description']);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Also test balance
async function checkBalance() {
  console.log('\n=== Checking Account Balance ===');
  try {
    const response = await axios.post('https://isms.celcomafrica.com/api/services/getbalance/', {
      partnerID: PARTNER_ID,
      apikey: API_KEY
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    console.log('Balance response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Balance check error:', error.response?.data || error.message);
  }
}

testSMS().then(() => checkBalance());
