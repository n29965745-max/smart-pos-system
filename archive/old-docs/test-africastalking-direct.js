// Direct test of Africa's Talking SMS API
// Run this with: node test-africastalking-direct.js

const AfricasTalking = require('africastalking');

// Your credentials
const credentials = {
  apiKey: 'REDACTED_AFRICASTALKING_KEY',
  username: 'NYLAWIGS'
};

console.log('Testing Africa\'s Talking SMS API...\n');
console.log('Credentials:', {
  username: credentials.username,
  apiKeyLength: credentials.apiKey.length,
  apiKeyPreview: credentials.apiKey.substring(0, 15) + '...'
});

// Initialize
const africastalking = AfricasTalking(credentials);
const sms = africastalking.SMS;

// Test phone number - using a different number since +254743794815 is blacklisted
const testPhoneNumber = '+254114098267';

async function testSMS() {
  try {
    console.log('\n📱 Attempting to send test SMS...');
    console.log('To:', testPhoneNumber);
    console.log('From:', 'NYLAWIGS');
    
    const result = await sms.send({
      to: [testPhoneNumber],
      message: 'Test message from Nyla Wigs POS system'
      // No 'from' - use default sender until NYLAWIGS sender ID is approved
    });

    console.log('\n✅ SUCCESS! Response from Africa\'s Talking:');
    console.log(JSON.stringify(result, null, 2));
    
    const recipient = result.SMSMessageData.Recipients[0];
    console.log('\n📊 Message Status:', recipient.status);
    console.log('💰 Cost:', recipient.cost);
    console.log('🆔 Message ID:', recipient.messageId);
    
    if (recipient.status === 'Success') {
      console.log('\n✅ Message sent successfully!');
      console.log('Check your phone for the message.');
    } else {
      console.log('\n⚠️ Message status:', recipient.status);
      console.log('This might indicate an account issue.');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    
    // Common error interpretations
    if (error.message.includes('authentication')) {
      console.log('\n🔑 Authentication failed - check your API key');
    } else if (error.message.includes('balance')) {
      console.log('\n💳 Insufficient balance - add credit to your account');
    } else if (error.message.includes('sender')) {
      console.log('\n📤 Sender ID issue - "NYLAWIGS" may not be approved');
    } else if (error.message.includes('account')) {
      console.log('\n⚠️ Account issue - your account may not be activated');
    }
  }
}

// Run the test
testSMS();
