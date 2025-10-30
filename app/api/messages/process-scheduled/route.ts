import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import twilio from 'twilio';

// This endpoint processes scheduled messages that are ready to be sent
// Should be called by a cron job every minute
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check for cron jobs
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // Get all SMS messages that are scheduled and ready to send
    const { data: smsMessages, error: smsError } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('status', 'queued')
      .not('scheduled_for', 'is', null)
      .lte('scheduled_for', now)
      .limit(50); // Process 50 at a time

    if (smsError) {
      console.error('Error fetching scheduled SMS:', smsError);
    }

    const smsResults = {
      sent: 0,
      failed: 0,
    };

    // Process SMS messages
    if (smsMessages && smsMessages.length > 0) {
      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      for (const message of smsMessages) {
        try {
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
              updated_at: new Date().toISOString(),
            })
            .eq('id', message.id);

          smsResults.sent++;
        } catch (error) {
          console.error(`Error sending SMS ${message.id}:`, error);

          await supabase
            .from('sms_messages')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              updated_at: new Date().toISOString(),
            })
            .eq('id', message.id);

          smsResults.failed++;
        }
      }
    }

    // Get all Email messages that are queued (emails don't use scheduled_for yet)
    const { data: emailMessages, error: emailError } = await supabase
      .from('email_messages')
      .select('*')
      .eq('status', 'queued')
      .limit(50); // Process 50 at a time

    if (emailError) {
      console.error('Error fetching queued emails:', emailError);
    }

    const emailResults = {
      sent: 0,
      failed: 0,
    };

    // Process Email messages
    if (emailMessages && emailMessages.length > 0) {
      for (const email of emailMessages) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId: email.id }),
          });

          if (response.ok) {
            emailResults.sent++;
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error(`Error sending email ${email.id}:`, error);

          await supabase
            .from('email_messages')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              updated_at: new Date().toISOString(),
            })
            .eq('id', email.id);

          emailResults.failed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      sms: {
        processed: smsMessages?.length || 0,
        sent: smsResults.sent,
        failed: smsResults.failed,
      },
      email: {
        processed: emailMessages?.length || 0,
        sent: emailResults.sent,
        failed: emailResults.failed,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing scheduled messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
