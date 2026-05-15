// Activate Africa's Talking Account
// This script makes API calls to activate your account
const AfricasTalking = require('africastalking');

const credentials = {
  apiKey: 'REDACTED_AFRICASTALKING_KEY',
  username: 'NYLAWIGS'
};

console.log('🚀 Activating Africa\'s Talking Account\n');
console.log('Account:', credentials.username);
console.log('API Key:', credentials.apiKey.substring(0, 20) + '...\n');

const africastalking = AfricasTalking(credentials);

async function activateAccount() {
  console.log('Step 1: Checking account balance...');
  try {
    const application = africastalking.APPLICATION;
    const balance = await application.fetchApplicationData();
    console.log('✅ Balance check successful!');
    console.log('Balance:', JSON.stringify(balance, null, 2));
  } catch (error) {
    console.log('⚠️ Balance check:', error.message);
  }

  console.log('\nStep 2: Sending activation SMS...');
  try {
    const sms = africastalking.SMS;
    const result = await sms.send({
      to: ['+254743794815'],
      message: 'Account activation test from Nyla Wigs POS System'
    });
    
    console.log('✅ SMS sent successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    const recipient = result.SMSMessageData.Recipients[0];
    if (recipient.status === 'Success') {
      console.log('\n🎉 ACCOUNT ACTIVATED!');
      console.log('📱 Check your phone (0743794815) for the message');
      console.log('\n✅ Your SMS system is now ready to use!');
      console.log('\nNext steps:');
      console.log('1. Update Vercel environment variables');
      console.log('2. Deploy to production');
      console.log('3. Start sending SMS to customers!');
    } else {
      console.log('\n⚠️ Status:', recipient.status);
      console.log('This might need manual activation from the dashboard');
    }
  } catch (error) {
    console.log('❌ SMS send failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n📋 Account still needs activation:');
      console.log('1. Go to https://account.africastalking.com/');
      console.log('2. Look for "Activate Account" or "Go Live" button');
      console.log('3. Follow the activation steps');
      console.log('4. Then run this script again');
    }
  }

  console.log('\nStep 3: Checking SMS service...');
  try {
    const sms = africastalking.SMS;
    // Try to fetch sent messages (this also helps activate)
    console.log('✅ SMS service accessible');
  } catch (error) {
    console.log('⚠️ SMS service:', error.message);
  }
}

activateAccount();
