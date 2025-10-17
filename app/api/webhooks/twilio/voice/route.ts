import { NextRequest, NextResponse } from 'next/server';

/**
 * Twilio Voice Webhook
 * Returns TwiML instructions for how to handle the call
 *
 * IMPORTANT: This is the PRIMARY call handler
 * Configure in Twilio: "A CALL COMES IN" -> this URL
 * NOT the status callback!
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const direction = formData.get('Direction') as string;

    console.log('📞 Twilio voice webhook:', { callSid, from, to, direction });

    // Generate TwiML response
    // This tells Twilio to connect the call and record it
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting your call.</Say>
  <Dial
    callerId="${from}"
    record="record-from-answer"
    recordingStatusCallback="${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/recording"
    recordingStatusCallbackEvent="completed"
    timeout="60"
  >
    <Number>${to}</Number>
  </Dial>
  <Say voice="alice">Call ended.</Say>
</Response>`;

    console.log('✅ TwiML generated for call:', callSid);

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('❌ Error in voice webhook:', error);

    // Return error TwiML (must return 200 for Twilio)
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, an error occurred. Please try again.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}

export const dynamic = 'force-dynamic';
