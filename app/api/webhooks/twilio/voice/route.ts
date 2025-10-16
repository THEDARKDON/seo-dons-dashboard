import { NextRequest, NextResponse } from 'next/server';

// TwiML response for voice webhook
export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const callSid = formData.get('CallSid');
  const from = formData.get('From');
  const to = formData.get('To');
  const callStatus = formData.get('CallStatus');

  console.log('Twilio voice webhook:', { callSid, from, to, callStatus });

  // Simple TwiML - just dial the destination number
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${from}" record="record-from-answer" recordingStatusCallback="${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/recording">
    <Number>${to}</Number>
  </Dial>
</Response>`;

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}
