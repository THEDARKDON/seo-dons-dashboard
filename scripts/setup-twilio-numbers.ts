// Script to list available UK numbers and purchase them for your SDRs
// Run with: npx tsx scripts/setup-twilio-numbers.ts

import { twilioConfig } from '@/lib/twilio/client';

async function getAuthHeader() {
  const credentials = Buffer.from(
    `${twilioConfig.accountSid}:${twilioConfig.authToken}`
  ).toString('base64');
  return `Basic ${credentials}`;
}

async function listIncomingPhoneNumbers() {
  console.log('\n🔍 Listing your current Twilio phone numbers...\n');

  const response = await fetch(
    `${twilioConfig.apiBaseUrl}/2010-04-01/Accounts/${twilioConfig.accountSid}/IncomingPhoneNumbers.json`,
    {
      headers: {
        Authorization: await getAuthHeader(),
      },
    }
  );

  const data = await response.json();

  if (data.incoming_phone_numbers && data.incoming_phone_numbers.length > 0) {
    console.log('📱 Your current phone numbers:');
    data.incoming_phone_numbers.forEach((num: any, i: number) => {
      console.log(`  ${i + 1}. ${num.phone_number} (${num.friendly_name || 'No name'})`);
    });
    console.log(`\nTotal: ${data.incoming_phone_numbers.length} numbers\n`);
    return data.incoming_phone_numbers;
  } else {
    console.log('❌ No phone numbers found in your account.\n');
    return [];
  }
}

async function searchAvailableUKNumbers() {
  console.log('🔍 Searching for available UK phone numbers...\n');

  const response = await fetch(
    `${twilioConfig.apiBaseUrl}/2010-04-01/Accounts/${twilioConfig.accountSid}/AvailablePhoneNumbers/GB/Local.json?Limit=20`,
    {
      headers: {
        Authorization: await getAuthHeader(),
      },
    }
  );

  const data = await response.json();

  if (data.available_phone_numbers && data.available_phone_numbers.length > 0) {
    console.log('📱 Available UK phone numbers to purchase:');
    data.available_phone_numbers.slice(0, 10).forEach((num: any, i: number) => {
      console.log(`  ${i + 1}. ${num.phone_number} (${num.locality || 'UK'})`);
    });
    console.log(`\nShowing 10 of ${data.available_phone_numbers.length} available\n`);
    return data.available_phone_numbers;
  } else {
    console.log('❌ No available UK numbers found.\n');
    return [];
  }
}

async function purchasePhoneNumber(phoneNumber: string, friendlyName?: string) {
  console.log(`\n💳 Purchasing ${phoneNumber}...`);

  const formData = new URLSearchParams();
  formData.append('PhoneNumber', phoneNumber);
  if (friendlyName) {
    formData.append('FriendlyName', friendlyName);
  }

  const response = await fetch(
    `${twilioConfig.apiBaseUrl}/2010-04-01/Accounts/${twilioConfig.accountSid}/IncomingPhoneNumbers.json`,
    {
      method: 'POST',
      headers: {
        Authorization: await getAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (response.ok) {
    console.log(`✅ Successfully purchased ${data.phone_number}`);
    return data;
  } else {
    console.error(`❌ Error purchasing number:`, data);
    return null;
  }
}

async function main() {
  console.log('🚀 Twilio UK Phone Number Setup\n');
  console.log('================================\n');

  // List current numbers
  const currentNumbers = await listIncomingPhoneNumbers();

  // Search available numbers
  const availableNumbers = await searchAvailableUKNumbers();

  console.log('\n📋 Next Steps:\n');

  if (currentNumbers.length >= 7) {
    console.log('✅ You already have enough numbers for 7 SDRs!');
    console.log('\nNumbers to assign to your SDRs:');
    currentNumbers.slice(0, 7).forEach((num: any, i: number) => {
      console.log(`  SDR ${i + 1}: ${num.phone_number}`);
    });
    console.log('\nNow you need to assign these numbers in the database.');
    console.log('Run the database setup SQL in Supabase SQL Editor.\n');
  } else {
    const needed = 7 - currentNumbers.length;
    console.log(`⚠️  You need to purchase ${needed} more UK phone numbers.`);
    console.log('\nTo purchase numbers programmatically, you can:');
    console.log('  1. Uncomment the purchase code in this script');
    console.log('  2. Or purchase manually from Twilio Console: https://console.twilio.com/\n');

    console.log('Example: To purchase the first available number:');
    console.log(`  await purchasePhoneNumber('${availableNumbers[0]?.phone_number}', 'SDR 1');\n`);
  }

  console.log('\n💡 Cost Estimate:');
  console.log('  UK Phone Number: ~£1.00/month each');
  console.log(`  7 SDRs x £1.00 = £7/month for numbers`);
  console.log(`  Calls: £365/month for 38,500 minutes`);
  console.log(`  Total: ~£372/month\n`);
}

main().catch(console.error);
