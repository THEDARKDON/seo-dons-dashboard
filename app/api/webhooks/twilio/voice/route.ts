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
    const callStatus = formData.get('CallStatus') as string;

    console.log('📞 Twilio voice webhook:', { callSid, from, to, direction, callStatus });

    // Check if this is an inbound call to a purchased number
    if (direction === 'inbound' || !direction) {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      // Find which user this phone number belongs to
      const { data: voipSettings } = await supabase
        .from('user_voip_settings')
        .select('user_id, assigned_phone_number')
        .eq('assigned_phone_number', to)
        .single();

      if (voipSettings) {
        // Get user's clerk_id for Twilio Client identity
        const { data: user } = await supabase
          .from('users')
          .select('id, clerk_id')
          .eq('id', voipSettings.user_id)
          .single();

        if (user) {
          console.log('✅ Routing inbound call to user:', user.clerk_id);

          // Create call record
          await supabase
            .from('call_recordings')
            .insert({
              user_id: user.id,
              call_sid: callSid,
              from_number: from,
              to_number: to,
              direction: 'inbound',
              status: callStatus || 'in-progress',
              created_at: new Date().toISOString(),
            });

          // Route to user's browser via Twilio Client
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Client>${user.clerk_id}</Client>
  </Dial>
</Response>`;

          return new NextResponse(twiml, {
            headers: {
              'Content-Type': 'text/xml',
            },
          });
        }
      }

      // No user found for this number
      console.log('⚠️ No user found for number:', to);
      const notFoundTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">This number is not configured. Please contact support.</Say>
  <Hangup/>
</Response>`;

      return new NextResponse(notFoundTwiml, {
        headers: {
          'Content-Type': 'text/xml',
        },
      });
    }

    // Outbound call - return empty TwiML (recording handled by API parameters)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
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

// Also support GET for Twilio's webhook validation
export async function GET(req: NextRequest) {
  // Return TwiML for GET requests too (some Twilio configurations use GET)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">This is the voice webhook endpoint. Please configure this URL with HTTP POST method in your Twilio console.</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

export const dynamic = 'force-dynamic';
