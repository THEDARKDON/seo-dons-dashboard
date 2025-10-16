import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { makeOutboundCall } from '@/lib/twilio/client';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { toNumber, customerId, dealId, leadId } = body;

    if (!toNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Get user from database
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's VoIP settings (with error logging for debugging)
    const { data: voipSettings, error: voipError } = await supabase
      .from('user_voip_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (voipError) {
      console.error('Error fetching VoIP settings:', voipError);
      console.log('User ID:', user.id);
    }

    // Temporary: Use a placeholder number if not configured
    // TODO: Replace with actual UK numbers once Twilio is properly configured
    const fromNumber = voipSettings?.assigned_phone_number || '+447700158258';

    if (!voipSettings?.assigned_phone_number) {
      console.warn('No phone number assigned to user. Using Twilio number directly.');
      console.log('VoIP settings:', voipSettings);
    }

    // Make the call via Twilio
    const callResponse = await makeOutboundCall({
      from: voipSettings?.caller_id_number || fromNumber,
      to: toNumber,
      timeout: 60,
      recordCall: voipSettings?.auto_record !== false,
    });

    // Create call record in database
    const { data: callRecord, error: dbError } = await supabase
      .from('call_recordings')
      .insert({
        call_sid: callResponse.sid,
        user_id: user.id,
        customer_id: customerId || null,
        deal_id: dealId || null,
        lead_id: leadId || null,
        direction: 'outbound',
        from_number: voipSettings?.caller_id_number || fromNumber,
        to_number: toNumber,
        status: 'initiated',
        transcription_status: voipSettings?.auto_transcribe ? 'pending' : null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error creating call record:', dbError);
    }

    // Add to call queue for tracking
    await supabase
      .from('call_queue')
      .insert({
        user_id: user.id,
        customer_id: customerId || null,
        deal_id: dealId || null,
        lead_id: leadId || null,
        phone_number: toNumber,
        status: 'calling',
        attempted_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      callSid: callResponse.sid,
      callRecordId: callRecord?.id,
    });
  } catch (error: any) {
    console.error('Error making call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to make call' },
      { status: 500 }
    );
  }
}
