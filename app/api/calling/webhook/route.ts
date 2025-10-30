import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRecordingUrl } from '@/lib/signalwire/client';

// SignalWire webhook handler for call status updates
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;

    if (!callSid) {
      return NextResponse.json({ error: 'CallSid is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Update call record
    const updateData: any = {
      status: callStatus?.toLowerCase() || 'completed',
    };

    if (callDuration) {
      updateData.duration_seconds = parseInt(callDuration);
      updateData.ended_at = new Date().toISOString();
    }

    if (recordingSid && recordingUrl) {
      updateData.recording_url = recordingUrl;
      updateData.recording_duration_seconds = parseInt(recordingDuration || '0');

      // If auto-transcribe is enabled, mark for transcription
      const { data: callRecord } = await supabase
        .from('call_recordings')
        .select('user_id, transcription_status')
        .eq('call_sid', callSid)
        .single();

      if (callRecord?.transcription_status === 'pending') {
        updateData.transcription_status = 'processing';

        // Trigger transcription job (we'll implement this next)
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/calling/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callSid,
            recordingUrl,
          }),
        });
      }
    }

    const { error } = await supabase
      .from('call_recordings')
      .update(updateData)
      .eq('call_sid', callSid);

    if (error) {
      console.error('Error updating call record:', error);
      return NextResponse.json({ error: 'Failed to update call record' }, { status: 500 });
    }

    // Update call queue if exists
    await supabase
      .from('call_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('status', 'calling')
      .eq('phone_number', formData.get('To') as string);

    // Trigger auto-send SMS/Email if call is completed
    if (callStatus === 'completed' || callStatus === 'no-answer' || callStatus === 'busy' || callStatus === 'failed') {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/calling/auto-send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callSid,
            callStatus,
          }),
        });
      } catch (autoSendError) {
        console.error('Error triggering auto-send:', autoSendError);
        // Don't fail the webhook if auto-send fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable CSRF protection for webhooks
export const dynamic = 'force-dynamic';
