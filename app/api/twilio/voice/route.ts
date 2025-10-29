import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;

    console.log('[Twilio Voice] Incoming call:', {
      callSid,
      from,
      to,
      callStatus,
    });

    const supabase = await createClient();

    // Find which user this phone number belongs to
    const { data: phoneNumber } = await supabase
      .from('user_phone_numbers')
      .select('user_id')
      .eq('phone_number', to)
      .eq('is_active', true)
      .single();

    if (!phoneNumber) {
      console.log('[Twilio Voice] No user found for number:', to);
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>This number is not configured. Please contact support.</Say>
  <Hangup/>
</Response>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    }

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('id, clerk_id')
      .eq('id', phoneNumber.user_id)
      .single();

    if (!user) {
      console.log('[Twilio Voice] User not found:', phoneNumber.user_id);
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>User not found. Please contact support.</Say>
  <Hangup/>
</Response>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    }

    // Create or update call record
    const { data: existingCall } = await supabase
      .from('call_recordings')
      .select('id')
      .eq('call_sid', callSid)
      .single();

    if (!existingCall) {
      // Create new inbound call record
      await supabase
        .from('call_recordings')
        .insert({
          user_id: phoneNumber.user_id,
          call_sid: callSid,
          from_number: from,
          to_number: to,
          direction: 'inbound',
          status: callStatus === 'ringing' ? 'in-progress' : callStatus,
          created_at: new Date().toISOString(),
        });
    } else {
      // Update existing call
      await supabase
        .from('call_recordings')
        .update({
          status: callStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('call_sid', callSid);
    }

    // Create TwiML response for inbound call
    // This will dial the call to the browser using Twilio Client
    const userIdentity = user.clerk_id;

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Client>${userIdentity}</Client>
  </Dial>
</Response>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  } catch (error) {
    console.error('[Twilio Voice] Error handling voice webhook:', error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>An error occurred. Please try again later.</Say>
  <Hangup/>
</Response>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  }
}
