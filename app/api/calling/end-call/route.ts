import { NextResponse } from 'next/server';
import { twilioConfig } from '@/lib/twilio/client';

/**
 * POST /api/calling/end-call
 * End an active call
 */
export async function POST(req: Request) {
  try {
    const { callSid } = await req.json();

    if (!callSid) {
      return NextResponse.json({ error: 'Call SID is required' }, { status: 400 });
    }

    // End the call via Twilio API
    const credentials = Buffer.from(
      `${twilioConfig.accountSid}:${twilioConfig.authToken}`
    ).toString('base64');

    const response = await fetch(
      `${twilioConfig.apiBaseUrl}/2010-04-01/Accounts/${twilioConfig.accountSid}/Calls/${callSid}.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          Status: 'completed',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to end call');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Call ended successfully',
      data,
    });
  } catch (error: any) {
    console.error('Error ending call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to end call' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
