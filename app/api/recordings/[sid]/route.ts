import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;

// Proxy endpoint to securely stream Twilio recordings
export async function GET(
  request: NextRequest,
  { params }: { params: { sid: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Try to find recording by recording_sid first, then fall back to call_sid
    let { data: recording } = await supabase
      .from('call_recordings')
      .select('id, user_id, recording_url, call_sid, recording_sid')
      .eq('recording_sid', params.sid)
      .single();

    // Fallback: try call_sid if not found by recording_sid
    if (!recording) {
      const { data: callRecord } = await supabase
        .from('call_recordings')
        .select('id, user_id, recording_url, call_sid, recording_sid')
        .eq('call_sid', params.sid)
        .single();
      recording = callRecord;
    }

    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Check permissions: user must be call owner or admin
    if (recording.user_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Use recording_sid if available, otherwise use call_sid
    const recordingSid = recording.recording_sid || params.sid;

    // Fetch recording from Twilio
    const twilioClient = twilio(accountSid, authToken);

    // Get recording details
    const twilioRecording = await twilioClient.recordings(recordingSid).fetch();

    // Construct the media URL (MP3 format)
    const mediaUrl = `https://api.twilio.com${twilioRecording.uri.replace('.json', '.mp3')}`;

    // Fetch the actual audio file with authentication
    const audioResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      }
    });

    if (!audioResponse.ok) {
      console.error('Failed to fetch recording from Twilio:', audioResponse.statusText);
      return NextResponse.json({ error: 'Failed to fetch recording' }, { status: 500 });
    }

    // Get the audio buffer
    const audioBuffer = await audioResponse.arrayBuffer();

    // Return the audio with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    console.error('Error proxying recording:', error);
    return NextResponse.json(
      { error: 'Failed to load recording' },
      { status: 500 }
    );
  }
}
