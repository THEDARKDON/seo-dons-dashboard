import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { to, message, delayMinutes, leadId, customerId, callId } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Get user's phone number from voip settings
    const { data: voipSettings } = await supabase
      .from('user_voip_settings')
      .select('assigned_phone_number')
      .eq('user_id', user.id)
      .single();

    if (!voipSettings?.assigned_phone_number) {
      return NextResponse.json(
        { error: 'No phone number assigned to your account' },
        { status: 400 }
      );
    }

    // Calculate scheduled time
    const scheduledFor = new Date();
    scheduledFor.setMinutes(scheduledFor.getMinutes() + (delayMinutes || 0));

    // Store scheduled SMS (we'll use a simple approach - store with 'queued' status)
    const { data: smsMessage, error } = await supabase
      .from('sms_messages')
      .insert({
        user_id: user.id,
        from_number: voipSettings.assigned_phone_number,
        to_number: to,
        direction: 'outbound',
        body: message,
        status: 'queued',
        conversation_id: to,
        call_id: callId || null,
        scheduled_for: scheduledFor.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Note: In production, you'd want to implement a background job/cron
    // to process scheduled messages. For now, we'll just store them.

    return NextResponse.json({
      success: true,
      message: 'SMS scheduled successfully',
      scheduledFor: scheduledFor.toISOString(),
      smsId: smsMessage.id,
    });
  } catch (error) {
    console.error('Error scheduling SMS:', error);
    return NextResponse.json(
      { error: 'Failed to schedule SMS' },
      { status: 500 }
    );
  }
}
