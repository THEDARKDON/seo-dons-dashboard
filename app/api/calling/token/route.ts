import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

// Twilio SDK for JWT generation
const AccessToken = require('twilio').jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's VoIP settings
    const { data: voipSettings } = await supabase
      .from('user_voip_settings')
      .select('assigned_phone_number, caller_id_number')
      .eq('user_id', user.id)
      .single();

    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID!;

    // For access tokens, use API Key if available, otherwise fall back to Account SID
    let apiKey: string;
    let apiSecret: string;

    if (process.env.TWILIO_API_KEY && process.env.TWILIO_API_SECRET) {
      apiKey = process.env.TWILIO_API_KEY;
      apiSecret = process.env.TWILIO_API_SECRET;
      console.log('[token] Using API Key for token generation');
    } else {
      apiKey = accountSid;
      apiSecret = process.env.TWILIO_AUTH_TOKEN!;
      console.log('[token] Using Account SID and Auth Token for token generation');
    }

    console.log('[token] Environment check:', {
      hasAccountSid: !!accountSid,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasTwimlAppSid: !!twimlAppSid,
      accountSid: accountSid?.substring(0, 10) + '...',
      apiKey: apiKey?.substring(0, 10) + '...',
      apiSecretLength: apiSecret?.length,
      twimlAppSid: twimlAppSid?.substring(0, 10) + '...',
    });

    // Create identity for this user
    const identity = `${user.first_name}_${user.last_name}_${user.id}`.replace(/\s/g, '_');

    // Create access token
    try {
      const token = new AccessToken(accountSid, apiKey, apiSecret, {
        identity: identity,
        ttl: 3600, // 1 hour
      });

      // Create a Voice grant with TwiML App SID
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: twimlAppSid,
        incomingAllow: true,
      });

      token.addGrant(voiceGrant);

      const jwt = token.toJwt();

      console.log('[token] Generated token for identity:', identity);
      console.log('[token] Token length:', jwt.length);
      console.log('[token] Token preview:', jwt.substring(0, 50) + '...');

      return NextResponse.json({
        token: jwt,
        identity: identity,
        phoneNumber: voipSettings?.assigned_phone_number || '+447700158258',
        userId: user.id,
      });
    } catch (tokenError: any) {
      console.error('[token] Error creating token:', tokenError);
      throw new Error('Failed to create access token: ' + tokenError.message);
    }
  } catch (error: any) {
    console.error('Error generating calling token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate token' },
      { status: 500 }
    );
  }
}
