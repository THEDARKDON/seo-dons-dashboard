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
    const apiKey = process.env.TWILIO_API_KEY || accountSid;
    const apiSecret = process.env.TWILIO_API_SECRET || process.env.TWILIO_AUTH_TOKEN!;

    // Create identity for this user
    const identity = `${user.first_name}_${user.last_name}_${user.id}`.replace(/\s/g, '_');

    // Create access token
    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity,
      ttl: 3600, // 1 hour
    });

    // Create a Voice grant (no app SID needed for basic calling)
    const voiceGrant = new VoiceGrant({
      incomingAllow: true,
    });

    token.addGrant(voiceGrant);

    return NextResponse.json({
      token: token.toJwt(),
      identity: identity,
      phoneNumber: voipSettings?.assigned_phone_number || '+447700158258',
      userId: user.id,
    });
  } catch (error: any) {
    console.error('Error generating calling token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate token' },
      { status: 500 }
    );
  }
}
