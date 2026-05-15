// Debug Africa's Talking Sandbox API Response
const fetch = require('node-fetch');

const API_KEY = 'REDACTED_AFRICASTALKING_KEY';
const USERNAME = 'NYLAWIGS';
const PHONE = '+254743794815';

console.log('🔍 Debugging Sandbox API Response\n');

async function debugActivation() {
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
        message: 'Test activation message',
        from: 'NYLAWIGS'
      })
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    const text = await response.text();
    console.log('Raw Response:');
    console.log(text);
    console.log('');

    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Not JSON - this is the actual response text');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugActivation();
