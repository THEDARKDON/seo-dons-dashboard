import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { google } from 'googleapis';

// Use service role client to bypass RLS (webhook calls don't have user session)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This endpoint is called after a call completes to trigger auto-send messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { callSid, callStatus, leadId, customerId } = body;

    if (!callSid) {
      return NextResponse.json({ error: 'callSid is required' }, { status: 400 });
    }

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
    const category = isSuccessful ? 'successful_call' : 'missed_call';

    console.log(`[Auto-Send] Call ${callSid} - Status: ${callStatus}, Duration: ${call.duration_seconds}s, Category: ${category}`);

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

    console.log(`[Auto-Send] Found ${smsTemplates.length} SMS templates and ${emailTemplates.length} Email templates for category "${category}"`);
    if (smsTemplates.length > 0) {
      console.log(`[Auto-Send] SMS templates: ${smsTemplates.map(t => t.name).join(', ')}`);
    }
    if (emailTemplates.length > 0) {
      console.log(`[Auto-Send] Email templates: ${emailTemplates.map(t => t.name).join(', ')}`);
    }
    console.log(`[Auto-Send] Contact info: phone=${contactInfo.phone}, email=${contactInfo.email}`);

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

      try {
        // Get user's Twilio phone number
        const { data: userSettings } = await supabase
          .from('user_voip_settings')
          .select('assigned_phone_number')
          .eq('user_id', call.user_id)
          .single();

        const fromNumber = userSettings?.assigned_phone_number;
        if (!fromNumber) {
          console.error('[Auto-Send] No Twilio phone number for user:', call.user_id);
          continue;
        }

        console.log(`[Auto-Send] Sending SMS via template "${template.name}" to ${contactInfo.phone}`);

        // Create SMS message (will be marked as 'sending' then 'sent')
        const { data: message, error: smsError } = await supabase
          .from('sms_messages')
          .insert({
            user_id: call.user_id,
            from_number: fromNumber,
            to_number: contactInfo.phone,
            direction: 'outbound',
            body,
            status: 'sending', // Changed from 'queued'
            lead_id: call.lead_id,
            customer_id: call.customer_id,
            call_id: call.id,
            conversation_id: contactInfo.phone,
          })
          .select()
          .single();

        if (smsError) {
          console.error('[Auto-Send] Error creating SMS:', smsError);
          continue;
        }

        // ALWAYS send immediately (delays disabled for free tier - no cron support)
        await sendSMSNow(message.id);

        results.sms.push({
          template: template.name,
          sentAt: new Date().toISOString(),
          messageId: message.id,
        });
      } catch (error) {
        console.error('[Auto-Send] Error processing SMS template:', error);
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
          console.error('[Auto-Send] No Gmail connected for user:', call.user_id);
          continue;
        }

        console.log(`[Auto-Send] Sending Email via template "${template.name}" to ${contactInfo.email}`);

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
            status: 'sending', // Changed from 'queued'
            lead_id: call.lead_id,
            customer_id: call.customer_id,
            call_id: call.id,
            conversation_id: contactInfo.email,
          })
          .select()
          .single();

        if (emailError) {
          console.error('[Auto-Send] Error creating email:', emailError);
          continue;
        }

        // Send email immediately via Gmail API
        await sendEmailNow(email.id);

        results.email.push({
          template: template.name,
          sentAt: new Date().toISOString(),
          emailId: email.id,
        });
      } catch (error) {
        console.error('[Auto-Send] Error processing email template:', error);
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
    const { data: message } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (!message) {
      console.error(`[SMS] Message ${messageId} not found`);
      return;
    }

    console.log(`[SMS] Sending to ${message.to_number}: ${message.body.substring(0, 50)}...`);

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const sent = await twilioClient.messages.create({
      body: message.body,
      from: message.from_number,
      to: message.to_number,
    });

    console.log(`[SMS] ✅ Sent successfully: SID ${sent.sid}`);

    await supabase
      .from('sms_messages')
      .update({
        status: 'sent',
        message_sid: sent.sid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);
  } catch (error) {
    console.error(`[SMS] ❌ Error sending ${messageId}:`, error);
    await supabase
      .from('sms_messages')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);
  }
}

// Helper function to send Email immediately
async function sendEmailNow(emailId: string) {
  try {
    console.log(`[Email] Sending email ${emailId} via Gmail API`);

    // Get email from database
    const { data: email } = await supabase
      .from('email_messages')
      .select('*, users!inner(email, first_name, last_name)')
      .eq('id', emailId)
      .single();

    if (!email) {
      console.error(`[Email] Email ${emailId} not found`);
      return;
    }

    // Get user's Google OAuth tokens
    const { data: googleAuth } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token, token_expiry')
      .eq('user_id', email.user_id)
      .eq('provider', 'google')
      .single();

    if (!googleAuth) {
      throw new Error('No Google account connected');
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/email/callback`
    );

    oauth2Client.setCredentials({
      access_token: googleAuth.access_token,
      refresh_token: googleAuth.refresh_token,
    });

    // Check if token needs refresh
    const tokenExpiry = new Date(googleAuth.token_expiry);
    if (tokenExpiry <= new Date()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      // Update stored tokens
      await supabase
        .from('user_integrations')
        .update({
          access_token: credentials.access_token,
          token_expiry: new Date(credentials.expiry_date!).toISOString(),
        })
        .eq('user_id', email.user_id)
        .eq('provider', 'google');
    }

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email message
    const emailLines = [
      `From: ${email.users.first_name} ${email.users.last_name} <${email.users.email}>`,
      `To: ${email.to_email}`,
      `Subject: ${email.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      email.body_html || email.body_text,
    ];

    const emailContent = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send email via Gmail
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    console.log(`[Email] ✅ Sent successfully: ${emailId} (Gmail ID: ${response.data.id})`);

    // Update email status
    await supabase
      .from('email_messages')
      .update({
        status: 'sent',
        gmail_message_id: response.data.id,
        gmail_thread_id: response.data.threadId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailId);
  } catch (error) {
    console.error(`[Email] ❌ Error sending ${emailId}:`, error);
    await supabase
      .from('email_messages')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailId);
  }
}

export const dynamic = 'force-dynamic';
