import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Webhook for call status updates
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

    console.log('Twilio status webhook:', { callSid, callStatus, callDuration, from, to });

    const supabase = await createClient();

    // Update call record in database
    const updateData: any = {
      status: callStatus.toLowerCase(),
      updated_at: new Date().toISOString(),
    };

    if (callDuration) {
      updateData.duration = parseInt(callDuration);
    }

    if (callStatus === 'completed' || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer') {
      updateData.ended_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('call_recordings')
      .update(updateData)
      .eq('call_sid', callSid);

    if (error) {
      console.error('Error updating call status:', error);
    }

    // Update call queue status
    await supabase
      .from('call_queue')
      .update({
        status: callStatus === 'completed' ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('phone_number', to)
      .eq('status', 'calling');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing status webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
