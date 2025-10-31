import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import twilio from 'twilio';

// This endpoint is called after a call completes to trigger auto-send messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { callSid, callStatus, leadId, customerId } = body;

    if (!callSid) {
      return NextResponse.json({ error: 'callSid is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get call details
    const { data: call, error: callError } = await supabase
      .from('call_recordings')
      .select(`
        *,
        lead:leads(*),
        customer:customers(*)
      `)
      .eq('call_sid', callSid)
      .single();

    if (callError || !call) {
      console.error('Call not found:', callError);
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Determine call outcome
    const isSuccessful = callStatus === 'completed' && (call.duration_seconds || 0) > 10;
    const category = isSuccessful ? 'post_call' : 'post_call';

    // Get contact info (prioritize lead, fallback to customer)
    let contactInfo: {
      phone?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      company?: string;
    } = {};

    if (call.lead) {
      contactInfo = {
        phone: call.lead.phone_number,
        email: call.lead.email,
        firstName: call.lead.first_name,
        lastName: call.lead.last_name,
        company: call.lead.company,
      };
    } else if (call.customer) {
      contactInfo = {
        phone: call.customer.phone_number,
        email: call.customer.email,
        firstName: call.customer.first_name,
        lastName: call.customer.last_name,
        company: call.customer.company,
      };
    }

    if (!contactInfo.phone && !contactInfo.email) {
      console.log('No contact info available for auto-send');
      return NextResponse.json({ message: 'No contact info available' });
    }

    // Query active auto-send templates
    const [smsTemplatesRes, emailTemplatesRes] = await Promise.all([
      supabase
        .from('sms_templates')
        .select('*')
        .eq('auto_send_after_call', true)
        .eq('is_active', true)
        .eq('category', category),
      supabase
        .from('email_templates')
        .select('*')
        .eq('auto_send_after_call', true)
        .eq('is_active', true)
        .eq('category', category),
    ]);

    const smsTemplates = smsTemplatesRes.data || [];
    const emailTemplates = emailTemplatesRes.data || [];

    // Helper function to replace variables
    const replaceVariables = (text: string): string => {
      return text
        .replace(/\{first_name\}/g, contactInfo.firstName || '')
        .replace(/\{last_name\}/g, contactInfo.lastName || '')
        .replace(/\{name\}/g, `${contactInfo.firstName || ''} ${contactInfo.lastName || ''}`.trim())
        .replace(/\{company\}/g, contactInfo.company || '');
    };

    const results = {
      sms: [] as any[],
      email: [] as any[],
    };

    // Process SMS templates
    for (const template of smsTemplates) {
      if (!contactInfo.phone) continue;

      const body = replaceVariables(template.body);
      const scheduledFor = new Date(Date.now() + template.auto_send_delay_minutes * 60 * 1000);

      try {
        // Get user's Twilio phone number
        const { data: userSettings } = await supabase
          .from('user_voip_settings')
          .select('assigned_phone_number')
          .eq('user_id', call.user_id)
          .single();

        const fromNumber = userSettings?.assigned_phone_number;
        if (!fromNumber) {
          console.error('No Twilio phone number for user:', call.user_id);
          continue;
        }

        // Create scheduled SMS message
        const { data: message, error: smsError } = await supabase
          .from('sms_messages')
          .insert({
            user_id: call.user_id,
            from_number: fromNumber,
            to_number: contactInfo.phone,
            direction: 'outbound',
            body,
            status: 'queued',
            lead_id: call.lead_id,
            customer_id: call.customer_id,
            call_id: call.id,
            conversation_id: contactInfo.phone,
            scheduled_for: scheduledFor.toISOString(),
          })
          .select()
          .single();

        if (smsError) {
          console.error('Error creating SMS:', smsError);
          continue;
        }

        results.sms.push({
          template: template.name,
          scheduledFor,
          messageId: message.id,
        });

        // If delay is 0, send immediately
        if (template.auto_send_delay_minutes === 0) {
          await sendSMSNow(message.id);
        }
      } catch (error) {
        console.error('Error processing SMS template:', error);
      }
    }

    // Process Email templates
    for (const template of emailTemplates) {
      if (!contactInfo.email) continue;

      const subject = replaceVariables(template.subject);
      const bodyHtml = replaceVariables(template.body_html);

      try {
        // Get user's email from integration
        const { data: integration } = await supabase
          .from('user_integrations')
          .select('metadata')
          .eq('user_id', call.user_id)
          .eq('provider', 'google')
          .single();

        const fromEmail = integration?.metadata?.email;
        if (!fromEmail) {
          console.error('No Gmail connected for user:', call.user_id);
          continue;
        }

        // Create email message
        const { data: email, error: emailError } = await supabase
          .from('email_messages')
          .insert({
            user_id: call.user_id,
            from_email: fromEmail,
            to_email: contactInfo.email,
            direction: 'outbound',
            subject,
            body_html: bodyHtml,
            body_text: bodyHtml.replace(/<[^>]*>/g, ''), // Strip HTML for text version
            status: 'queued',
            lead_id: call.lead_id,
            customer_id: call.customer_id,
            call_id: call.id,
            conversation_id: contactInfo.email,
          })
          .select()
          .single();

        if (emailError) {
          console.error('Error creating email:', emailError);
          continue;
        }

        results.email.push({
          template: template.name,
          emailId: email.id,
        });

        // Send email immediately (no delay for emails in current implementation)
        await sendEmailNow(email.id);
      } catch (error) {
        console.error('Error processing email template:', error);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Auto-send triggered: ${results.sms.length} SMS, ${results.email.length} Email`,
    });
  } catch (error) {
    console.error('Error in auto-send handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to send SMS immediately
async function sendSMSNow(messageId: string) {
  try {
    const supabase = await createClient();

    const { data: message } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (!message) return;

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const sent = await twilioClient.messages.create({
      body: message.body,
      from: message.from_number,
      to: message.to_number,
    });

    await supabase
      .from('sms_messages')
      .update({
        status: 'sent',
        message_sid: sent.sid,
      })
      .eq('id', messageId);
  } catch (error) {
    console.error('Error sending SMS:', error);
    const supabase = await createClient();
    await supabase
      .from('sms_messages')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', messageId);
  }
}

// Helper function to send Email immediately
async function sendEmailNow(emailId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

export const dynamic = 'force-dynamic';
