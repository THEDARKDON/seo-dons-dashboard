import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Webhook for recording status updates
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const callSid = formData.get('CallSid') as string;
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingStatus = formData.get('RecordingStatus') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;

    console.log('Twilio recording webhook:', {
      callSid,
      recordingSid,
      recordingUrl,
      recordingStatus,
      recordingDuration,
    });

    const supabase = await createClient();

    // Update call record with recording information
    const { error } = await supabase
      .from('call_recordings')
      .update({
        recording_sid: recordingSid,
        recording_url: recordingUrl,
        recording_duration_seconds: recordingDuration ? parseInt(recordingDuration) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('call_sid', callSid);

    if (error) {
      console.error('Error updating recording info:', error);
    }

    // If auto-transcription is enabled, trigger transcription
    const { data: callRecord } = await supabase
      .from('call_recordings')
      .select('id, transcription_status, user_id')
      .eq('call_sid', callSid)
      .single();

    if (callRecord?.transcription_status === 'pending') {
      // TODO: Trigger OpenAI Whisper transcription
      // This will be implemented when OpenAI integration is set up
      console.log('Transcription pending for call:', callRecord.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing recording webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
