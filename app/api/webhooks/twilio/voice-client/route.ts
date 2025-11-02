import { NextRequest, NextResponse } from 'next/server';

/**
 * TwiML App Voice Webhook
 * This handles calls made from the browser using Twilio Voice SDK
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const to = formData.get('To') as string;
    const from = formData.get('From') as string;
    const callerId = formData.get('CallerId') as string;

    console.log('📱 Browser call initiated:', { to, from, callerId });

    // Generate TwiML to dial the destination number
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${callerId}" record="record-from-answer" recordingStatusCallback="${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/recording" recordingStatusCallbackEvent="completed" action="${process.env.NEXT_PUBLIC_APP_URL}/api/calling/webhook" method="POST">
    <Number>${to}</Number>
  </Dial>
</Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('❌ Error in voice client webhook:', error);

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, an error occurred. Please try again.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}

export const dynamic = 'force-dynamic';
