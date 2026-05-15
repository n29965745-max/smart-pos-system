// Fresh Africa's Talking Test - With Better Error Handling
require('dotenv').config({ path: '.env.local' });

async function testAfricasTalking() {
  console.log('🧪 Testing Africa\'s Talking SMS\n');

  // Check if we have credentials
  const username = process.env.AFRICASTALKING_USERNAME || 'NYLAWIGS';
  const apiKey = process.env.AFRICASTALKING_API_KEY || 'REDACTED_AFRICASTALKING_KEY';
  const testPhone = '+254743794815';

  console.log('✅ Credentials found:');
  console.log('   Username:', username);
  console.log('   API Key:', apiKey.substring(0, 15) + '...');
  console.log('   Test Phone:', testPhone);
  console.log('');

  try {
    // Try to load the package
    console.log('📦 Loading africastalking package...');
    const AfricasTalking = require('africastalking');
    console.log('✅ Package loaded successfully');
    console.log('');

    // Initialize
    console.log('🔧 Initializing Africa\'s Talking...');
    const africastalking = AfricasTalking({
      apiKey: apiKey,
      username: username
    });
    const sms = africastalking.SMS;
    console.log('✅ Initialized successfully');
    console.log('');

    // Send test SMS
    console.log('📱 Sending test SMS...');
    console.log('   To:', testPhone);
    console.log('   Message: "Hello from Nyla Wigs! Your SMS system is working with Africa\'s Talking."');
    console.log('');

    const result = await sms.send({
      to: [testPhone],
      message: 'Hello from Nyla Wigs! 🎉 Your SMS system is working with Africa\'s Talking. Cost: KSH 0.80/SMS',
      from: 'NYLAWIGS'  // Try with sender ID first
    });

    console.log('📥 Response:', JSON.stringify(result, null, 2));
    console.log('');

    if (result.SMSMessageData && result.SMSMessageData.Recipients) {
      const recipient = result.SMSMessageData.Recipients[0];
      console.log('📊 Status:', recipient.status);
      console.log('💰 Cost:', recipient.cost);
      console.log('🆔 Message ID:', recipient.messageId);
      console.log('');

      if (recipient.status === 'Success') {
        console.log('✅ SUCCESS! SMS sent via Africa\'s Talking!');
        console.log('📱 Check your phone (0743794815) for the message');
        console.log('');
        console.log('🎉 Your SMS system is ready!');
        console.log('');
        console.log('💰 Cost: KSH 0.80 per SMS');
        console.log('');
        console.log('📋 Next Steps:');
        console.log('1. Update .env.local with Africa\'s Talking credentials');
        console.log('2. Update Vercel environment variables');
        console.log('3. Deploy to production');
      } else {
        console.log('⚠️ Message status:', recipient.status);
        console.log('');
        
        if (recipient.status.includes('InvalidSenderId')) {
          console.log('❌ Sender ID "NYLAWIGS" not approved');
          console.log('');
          console.log('Solutions:');
          console.log('1. Register "NYLAWIGS" in Africa\'s Talking dashboard');
          console.log('2. Or try without custom sender ID (will use default)');
          console.log('');
          console.log('Let me try without sender ID...');
          
          // Retry without sender ID
          const result2 = await sms.send({
            to: [testPhone],
            message: 'Hello from Nyla Wigs! Testing without custom sender ID.'
          });
          
          const recipient2 = result2.SMSMessageData.Recipients[0];
          console.log('');
          console.log('📊 Second attempt status:', recipient2.status);
          
          if (recipient2.status === 'Success') {
            console.log('✅ SUCCESS without custom sender ID!');
            console.log('📱 Check your phone for the message');
            console.log('');
            console.log('💡 You can register "NYLAWIGS" later in the dashboard');
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('');
    
    if (error.message.includes('Cannot find module')) {
      console.log('📦 Package not installed');
      console.log('');
      console.log('Run: npm install africastalking');
    } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      console.log('🔑 Authentication failed');
      console.log('');
      console.log('Possible causes:');
      console.log('1. API key is invalid or expired');
      console.log('2. Username is incorrect');
      console.log('3. Account not activated');
      console.log('');
      console.log('Solutions:');
      console.log('1. Login to https://account.africastalking.com/');
      console.log('2. Go to Settings → API Key');
      console.log('3. Generate a new API key');
      console.log('4. Make sure account is activated (not sandbox)');
    } else if (error.message.includes('InsufficientBalance')) {
      console.log('💳 Insufficient balance');
      console.log('');
      console.log('Add credit at: https://account.africastalking.com/billing');
    } else {
      console.log('Full error:', error);
    }
  }
}

testAfricasTalking();
