import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      to,
      message,
      leadId,
      customerId,
      callId,
    } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's phone number
    const { data: voipSettings } = await supabase
      .from('user_voip_settings')
      .select('assigned_phone_number, sms_enabled')
      .eq('user_id', user.id)
      .single();

    if (!voipSettings?.assigned_phone_number) {
      return NextResponse.json(
        { error: 'No phone number assigned to your account' },
        { status: 400 }
      );
    }

    if (!voipSettings.sms_enabled) {
      return NextResponse.json(
        { error: 'SMS is not enabled for your account' },
        { status: 400 }
      );
    }

    // Send SMS via Twilio
    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: voipSettings.assigned_phone_number,
      to: to,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/sms/status`,
    });

    console.log('✅ SMS sent:', twilioMessage.sid);

    // Store in database
    const { data: smsMessage, error: insertError } = await supabase
      .from('sms_messages')
      .insert({
        user_id: user.id,
        from_number: voipSettings.assigned_phone_number,
        to_number: to,
        direction: 'outbound',
        body: message,
        status: twilioMessage.status,
        message_sid: twilioMessage.sid,
        num_segments: twilioMessage.numSegments || 1,
        conversation_id: to,
        lead_id: leadId || null,
        customer_id: customerId || null,
        call_id: callId || null,
        is_read: true, // Mark own messages as read
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing SMS:', insertError);
    }

    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully',
      smsMessage,
      twilioSid: twilioMessage.sid,
    });
  } catch (error: any) {
    console.error('❌ Error sending SMS:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
