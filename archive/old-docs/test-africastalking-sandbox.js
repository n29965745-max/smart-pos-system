// Test Africa's Talking with Sandbox Mode
const AfricasTalking = require('africastalking');

console.log('🧪 Testing Africa\'s Talking - Sandbox vs Production\n');

// Test 1: Production with NYLAWIGS
console.log('Test 1: Production Mode with NYLAWIGS username');
const apiKey = 'REDACTED_AFRICASTALKING_KEY';

async function testProduction() {
  try {
    const africastalking = AfricasTalking({
      apiKey: apiKey,
      username: 'NYLAWIGS'
    });
    const sms = africastalking.SMS;
    
    const result = await sms.send({
      to: ['+254743794815'],
      message: 'Test from production'
    });
    
    console.log('✅ Production SUCCESS:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Production FAILED:', error.message);
  }
}

// Test 2: Sandbox mode
async function testSandbox() {
  console.log('\nTest 2: Sandbox Mode');
  try {
    const africastalking = AfricasTalking({
      apiKey: apiKey,
      username: 'sandbox'
    });
    const sms = africastalking.SMS;
    
    const result = await sms.send({
      to: ['+254743794815'],
      message: 'Test from sandbox'
    });
    
    console.log('✅ Sandbox SUCCESS:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Sandbox FAILED:', error.message);
  }
}

async function runTests() {
  await testProduction();
  await testSandbox();
  
  console.log('\n📋 Next Steps:');
  console.log('1. If Production worked: Your account is activated!');
  console.log('2. If Sandbox worked: Your account is in sandbox mode');
  console.log('   - Login to https://account.africastalking.com/');
  console.log('   - Go to "Go Live" or "Activate Account"');
  console.log('   - Follow the activation steps');
  console.log('3. If both failed: Check your API key in the dashboard');
}

runTests();
