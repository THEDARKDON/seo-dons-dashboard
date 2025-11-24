import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Twilio SMS Webhook
 * Receives incoming SMS messages and stores them in database
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const messageSid = formData.get('MessageSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const numSegments = parseInt(formData.get('NumSegments') as string) || 1;
    const numMedia = parseInt(formData.get('NumMedia') as string) || 0;

    console.log('📱 Incoming SMS:', {
      messageSid,
      from,
      to,
      bodyLength: body?.length,
      numSegments,
      numMedia,
    });

    const supabase = await createClient();

    // Find which user this phone number belongs to
    const { data: voipSettings } = await supabase
      .from('user_voip_settings')
      .select('user_id, assigned_phone_number')
      .eq('assigned_phone_number', to)
      .eq('sms_enabled', true)
      .single();

    if (!voipSettings) {
      console.log('⚠️ No user found for SMS number:', to);
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    }

    // Get media URLs if present
    const mediaUrls = [];
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = formData.get(`MediaUrl${i}`);
      if (mediaUrl) {
        mediaUrls.push({
          url: mediaUrl,
          contentType: formData.get(`MediaContentType${i}`),
        });
      }
    }

    // Check if sender is a lead or customer
    let leadId = null;
    let customerId = null;

    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', from)
      .single();

    if (lead) {
      leadId = lead.id;
    } else {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', from)
        .single();

      if (customer) {
        customerId = customer.id;
      }
    }

    // Store SMS message
    const { error: insertError } = await supabase
      .from('sms_messages')
      .insert({
        user_id: voipSettings.user_id,
        from_number: from,
        to_number: to,
        direction: 'inbound',
        body: body || '',
        status: 'received',
        message_sid: messageSid,
        num_segments: numSegments,
        num_media: numMedia,
        media_urls: mediaUrls,
        conversation_id: from, // Group by sender's number
        lead_id: leadId,
        customer_id: customerId,
        is_read: false,
      });

    if (insertError) {
      console.error('Error storing SMS:', insertError);
    } else {
      console.log('✅ SMS stored successfully');
    }

    // Return empty TwiML response
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  } catch (error) {
    console.error('❌ Error in SMS webhook:', error);

    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  }
}
