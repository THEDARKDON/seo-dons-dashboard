// Twilio client configuration for Ireland (IE1) region
export const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID!,
  authToken: process.env.TWILIO_AUTH_TOKEN!,
  region: process.env.TWILIO_REGION || 'ie1',
  apiBaseUrl: process.env.TWILIO_API_BASE_URL || 'https://api.ie1.twilio.com',
};

// Validate configuration
export function validateTwilioConfig() {
  const missing: string[] = [];

  if (!process.env.TWILIO_ACCOUNT_SID) missing.push('TWILIO_ACCOUNT_SID');
  if (!process.env.TWILIO_AUTH_TOKEN) missing.push('TWILIO_AUTH_TOKEN');

  if (missing.length > 0) {
    throw new Error(`Missing Twilio environment variables: ${missing.join(', ')}`);
  }
}

// Create authorization header
function getAuthHeader() {
  const credentials = Buffer.from(
    `${twilioConfig.accountSid}:${twilioConfig.authToken}`
  ).toString('base64');
  return `Basic ${credentials}`;
}

// Make outbound call
export interface MakeCallParams {
  from: string;
  to: string;
  timeout?: number;
  recordCall?: boolean;
  statusCallback?: string;
}

export async function makeOutboundCall(params: MakeCallParams) {
  validateTwilioConfig();

  const formData = new URLSearchParams();
  formData.append('From', params.from);
  formData.append('To', params.to);
  formData.append('Url', `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/voice`);

  if (params.timeout) {
    formData.append('Timeout', params.timeout.toString());
  }

  if (params.recordCall !== false) {
    formData.append('Record', 'true');
    formData.append('RecordingStatusCallback', `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/recording`);
  }

  if (params.statusCallback) {
    formData.append('StatusCallback', params.statusCallback);
  }

  const response = await fetch(
    `${twilioConfig.apiBaseUrl}/2010-04-01/Accounts/${twilioConfig.accountSid}/Calls.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to make call: ${error.message || JSON.stringify(error)}`);
  }

  return await response.json();
}

// Get call details
export async function getCallDetails(callSid: string) {
  validateTwilioConfig();

  const response = await fetch(
    `${twilioConfig.apiBaseUrl}/2010-04-01/Accounts/${twilioConfig.accountSid}/Calls/${callSid}.json`,
    {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get call details: ${error.message || JSON.stringify(error)}`);
  }

  return await response.json();
}

// Get recording URL
export async function getRecordingUrl(recordingSid: string) {
  validateTwilioConfig();
  return `${twilioConfig.apiBaseUrl}/2010-04-01/Accounts/${twilioConfig.accountSid}/Recordings/${recordingSid}`;
}

// Download recording
export async function downloadRecording(recordingSid: string) {
  validateTwilioConfig();

  const response = await fetch(
    `${twilioConfig.apiBaseUrl}/2010-04-01/Accounts/${twilioConfig.accountSid}/Recordings/${recordingSid}`,
    {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to download recording: ${error}`);
  }

  return await response.arrayBuffer();
}

// List available phone numbers for purchase (UK)
export async function listAvailableUKNumbers(areaCode?: string) {
  validateTwilioConfig();

  const params = new URLSearchParams();
  if (areaCode) {
    params.append('AreaCode', areaCode);
  }
  params.append('Limit', '20');

  const response = await fetch(
    `${twilioConfig.apiBaseUrl}/2010-04-01/Accounts/${twilioConfig.accountSid}/AvailablePhoneNumbers/GB/Local.json?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to list available numbers: ${error.message || JSON.stringify(error)}`);
  }

  return await response.json();
}

// Purchase phone number
export async function purchasePhoneNumber(phoneNumber: string) {
  validateTwilioConfig();

  const formData = new URLSearchParams();
  formData.append('PhoneNumber', phoneNumber);
  formData.append('VoiceUrl', `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/voice`);
  formData.append('StatusCallback', `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`);

  const response = await fetch(
    `${twilioConfig.apiBaseUrl}/2010-04-01/Accounts/${twilioConfig.accountSid}/IncomingPhoneNumbers.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to purchase number: ${error.message || JSON.stringify(error)}`);
  }

  return await response.json();
}
