import { SignalWire } from '@signalwire/realtime-api';

// SignalWire client configuration
export const signalwireConfig = {
  projectId: process.env.SIGNALWIRE_PROJECT_ID!,
  token: process.env.SIGNALWIRE_API_TOKEN!,
  spaceUrl: process.env.SIGNALWIRE_SPACE_URL!,
};

// Validate configuration
export function validateSignalWireConfig() {
  const missing: string[] = [];

  if (!process.env.SIGNALWIRE_PROJECT_ID) missing.push('SIGNALWIRE_PROJECT_ID');
  if (!process.env.SIGNALWIRE_API_TOKEN) missing.push('SIGNALWIRE_API_TOKEN');
  if (!process.env.SIGNALWIRE_SPACE_URL) missing.push('SIGNALWIRE_SPACE_URL');

  if (missing.length > 0) {
    throw new Error(`Missing SignalWire environment variables: ${missing.join(', ')}`);
  }
}

// Create SignalWire client instance
export async function createSignalWireClient() {
  validateSignalWireConfig();

  const client = await SignalWire({
    project: signalwireConfig.projectId,
    token: signalwireConfig.token,
  });

  return client;
}

// Generate access token for WebRTC client
export async function generateClientToken(identity: string, roomName?: string) {
  validateSignalWireConfig();

  const token = await fetch(`https://${signalwireConfig.spaceUrl}/api/relay/rest/jwt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${signalwireConfig.projectId}:${signalwireConfig.token}`).toString('base64')}`,
    },
    body: JSON.stringify({
      expires_in: 3600, // 1 hour
      identity,
      scopes: ['calling'],
      ...(roomName && { room: roomName }),
    }),
  });

  if (!token.ok) {
    const error = await token.text();
    throw new Error(`Failed to generate SignalWire token: ${error}`);
  }

  const data = await token.json();
  return data.jwt_token;
}

// Make outbound call
export interface MakeCallParams {
  from: string;
  to: string;
  timeout?: number;
  recordCall?: boolean;
}

export async function makeOutboundCall(params: MakeCallParams) {
  validateSignalWireConfig();

  const response = await fetch(`https://${signalwireConfig.spaceUrl}/api/relay/rest/calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${signalwireConfig.projectId}:${signalwireConfig.token}`).toString('base64')}`,
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      timeout: params.timeout || 60,
      record: params.recordCall !== false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to make call: ${error}`);
  }

  return await response.json();
}

// Get call details
export async function getCallDetails(callSid: string) {
  validateSignalWireConfig();

  const response = await fetch(`https://${signalwireConfig.spaceUrl}/api/relay/rest/calls/${callSid}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${signalwireConfig.projectId}:${signalwireConfig.token}`).toString('base64')}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get call details: ${error}`);
  }

  return await response.json();
}

// Get recording URL
export async function getRecordingUrl(recordingSid: string) {
  validateSignalWireConfig();

  return `https://${signalwireConfig.spaceUrl}/api/relay/rest/recordings/${recordingSid}`;
}

// Download recording
export async function downloadRecording(recordingSid: string) {
  validateSignalWireConfig();

  const response = await fetch(`https://${signalwireConfig.spaceUrl}/api/relay/rest/recordings/${recordingSid}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${signalwireConfig.projectId}:${signalwireConfig.token}`).toString('base64')}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to download recording: ${error}`);
  }

  return await response.arrayBuffer();
}
