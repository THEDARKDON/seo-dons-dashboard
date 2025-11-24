import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { downloadRecording } from '@/lib/signalwire/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { callSid, recordingUrl } = await req.json();

    if (!callSid) {
      return NextResponse.json({ error: 'CallSid is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get call record
    const { data: callRecord } = await supabase
      .from('call_recordings')
      .select('*')
      .eq('call_sid', callSid)
      .single();

    if (!callRecord) {
      return NextResponse.json({ error: 'Call record not found' }, { status: 404 });
    }

    // Download recording
    let audioBuffer: ArrayBuffer;

    if (recordingUrl) {
      // Download from SignalWire
      const response = await fetch(recordingUrl);
      audioBuffer = await response.arrayBuffer();
    } else if (callRecord.recording_url) {
      // Download from stored URL
      const response = await fetch(callRecord.recording_url);
      audioBuffer = await response.arrayBuffer();
    } else {
      return NextResponse.json({ error: 'No recording URL available' }, { status: 400 });
    }

    // Convert to File object for OpenAI
    const audioFile = new File([audioBuffer], 'recording.wav', { type: 'audio/wav' });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    // Update call record with transcription
    const { error: updateError } = await supabase
      .from('call_recordings')
      .update({
        transcription: transcription.text,
        transcription_status: 'completed',
      })
      .eq('call_sid', callSid);

    if (updateError) {
      console.error('Error updating transcription:', updateError);
      return NextResponse.json({ error: 'Failed to save transcription' }, { status: 500 });
    }

    // Trigger AI analysis (sentiment, topics, action items)
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/calling/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callSid, transcription: transcription.text }),
    });

    return NextResponse.json({
      success: true,
      transcription: transcription.text,
    });
  } catch (error: any) {
    console.error('Error transcribing call:', error);

    // Update status to failed
    if (req.body) {
      const { callSid } = await req.json();
      const supabase = await createClient();
      await supabase
        .from('call_recordings')
        .update({ transcription_status: 'failed' })
        .eq('call_sid', callSid);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to transcribe call' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
