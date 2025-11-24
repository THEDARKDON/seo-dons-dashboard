import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

// POST /api/webhooks/instantly - Handle Instantly.ai webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, lead_email, campaign_id, lead_id, link_url, ip_address, user_agent } = body;

    console.log('[Instantly Webhook] Event received:', {
      event,
      lead_email,
      campaign_id,
      lead_id,
    });

    if (!lead_email) {
      return NextResponse.json({ error: 'lead_email is required' }, { status: 400 });
    }

    // Find lead by email
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, assigned_to')
      .eq('email', lead_email)
      .single();

    if (leadError || !lead) {
      console.log('[Instantly Webhook] Lead not found for email:', lead_email);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Map Instantly events to our event types
    const eventTypeMap: Record<string, string> = {
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.replied': 'replied',
      'email.bounced': 'bounced',
      'lead.unsubscribed': 'unsubscribed',
    };

    const eventType = eventTypeMap[event] || event;

    // Create tracking event
    await supabase.from('email_tracking_events').insert({
      lead_id: lead.id,
      event_type: eventType,
      instantly_campaign_id: campaign_id,
      ip_address,
      user_agent,
      clicked_link: link_url,
    });

    // Update lead based on event type
    const updateData: any = {
      instantly_campaign_id: campaign_id,
      instantly_lead_id: lead_id,
    };

    switch (eventType) {
      case 'opened':
        // Increment open count and update last opened timestamp
        const { data: currentLead } = await supabase
          .from('leads')
          .select('email_opened_count')
          .eq('id', lead.id)
          .single();

        updateData.email_opened = true;
        updateData.email_opened_count = (currentLead?.email_opened_count || 0) + 1;
        updateData.last_email_opened_at = new Date().toISOString();

        console.log(`[Instantly Webhook] Lead ${lead_email} opened email (count: ${updateData.email_opened_count})`);
        break;

      case 'clicked':
        updateData.email_clicked = true;
        console.log(`[Instantly Webhook] Lead ${lead_email} clicked link: ${link_url}`);
        break;

      case 'replied':
        updateData.email_replied = true;
        console.log(`[Instantly Webhook] Lead ${lead_email} replied to email`);
        break;

      case 'bounced':
        updateData.email_bounced = true;
        updateData.instantly_status = 'bounced';
        console.log(`[Instantly Webhook] Lead ${lead_email} email bounced`);
        break;

      case 'unsubscribed':
        updateData.instantly_status = 'unsubscribed';
        console.log(`[Instantly Webhook] Lead ${lead_email} unsubscribed`);
        break;
    }

    // Update lead
    await supabase
      .from('leads')
      .update(updateData)
      .eq('id', lead.id);

    return NextResponse.json({
      success: true,
      message: `Event ${eventType} processed for lead ${lead_email}`,
    });
  } catch (error: any) {
    console.error('[Instantly Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/webhooks/instantly - Test endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Instantly.ai webhook endpoint is active',
    supported_events: [
      'email.opened',
      'email.clicked',
      'email.replied',
      'email.bounced',
      'lead.unsubscribed',
    ],
  });
}
