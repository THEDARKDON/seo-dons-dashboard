// Check Twilio account status and available countries
import { twilioConfig } from '@/lib/twilio/client';

async function getAuthHeader() {
  const credentials = Buffer.from(
    `${twilioConfig.accountSid}:${twilioConfig.authToken}`
  ).toString('base64');
  return `Basic ${credentials}`;
}

async function checkAccountStatus() {
  console.log('🔍 Checking Twilio account status...\n');

  const response = await fetch(
    `${twilioConfig.apiBaseUrl}/2010-04-01/Accounts/${twilioConfig.accountSid}.json`,
    {
      headers: {
        Authorization: await getAuthHeader(),
      },
    }
  );

  const data = await response.json();
  console.log('Account Status:', data.status);
  console.log('Account Type:', data.type);
  console.log('Account Created:', data.date_created);
  console.log('\n');

  return data;
}

async function listAvailableCountries() {
  console.log('🌍 Checking available phone number countries...\n');

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/AvailablePhoneNumbers.json`,
    {
      headers: {
        Authorization: await getAuthHeader(),
      },
    }
  );

  const data = await response.json();

  if (data.countries) {
    console.log('📱 Countries where you can purchase numbers:');
    const ukCountry = data.countries.find((c: any) => c.country_code === 'GB');

    if (ukCountry) {
      console.log('\n✅ UK (GB) is available!');
      console.log(`   URI: ${ukCountry.uri}`);

      // Try different number types
      await checkUKNumberTypes();
    } else {
      console.log('\n❌ UK numbers not available for your account yet.');
      console.log('\nAvailable countries:');
      data.countries.slice(0, 10).forEach((c: any) => {
        console.log(`   - ${c.country} (${c.country_code})`);
      });
    }
  }
}

async function checkUKNumberTypes() {
  console.log('\n📞 Checking UK number types...\n');

  const types = ['Mobile', 'Local', 'TollFree', 'National'];

  for (const type of types) {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/AvailablePhoneNumbers/GB/${type}.json`,
        {
          headers: {
            Authorization: await getAuthHeader(),
          },
        }
      );

      const data = await response.json();

      if (data.available_phone_numbers && data.available_phone_numbers.length > 0) {
        console.log(`✅ ${type}: ${data.available_phone_numbers.length} numbers available`);
        console.log(`   Example: ${data.available_phone_numbers[0].phone_number}`);
      } else if (data.code) {
        console.log(`❌ ${type}: ${data.message}`);
      } else {
        console.log(`⚠️  ${type}: No numbers available`);
      }
    } catch (error) {
      console.log(`❌ ${type}: Error checking`);
    }
  }
}

async function main() {
  try {
    await checkAccountStatus();
    await listAvailableCountries();
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('authenticate')) {
      console.log('\n⚠️  Authentication failed. Please check your credentials.');
    }
  }
}

main();
