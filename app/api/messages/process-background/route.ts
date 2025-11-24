import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Background processor for stuck messages
 * Called opportunistically when users are active in the app
 * Retries messages that failed to send or got stuck in 'sending' state
 */
export async function POST(request: NextRequest) {
  try {
    const now = new Date().toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    // Find stuck SMS messages (status='sending' for >5 minutes)
    const { data: stuckSMS } = await supabase
      .from('sms_messages')
      .select('*')
      .in('status', ['queued', 'sending'])
      .lt('created_at', fiveMinutesAgo)
      .limit(10);

    if (stuckSMS && stuckSMS.length > 0) {
      console.log(`[Background] Found ${stuckSMS.length} stuck SMS messages, retrying...`);

      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      for (const msg of stuckSMS) {
        processed++;
        try {
          const sent = await twilioClient.messages.create({
            body: msg.body,
            from: msg.from_number,
            to: msg.to_number,
          });

          await supabase
            .from('sms_messages')
            .update({
              status: 'sent',
              message_sid: sent.sid,
              updated_at: now,
            })
            .eq('id', msg.id);

          succeeded++;
          console.log(`[Background] ✅ Retried SMS ${msg.id} successfully`);
        } catch (error) {
          failed++;
          console.error(`[Background] ❌ Failed to retry SMS ${msg.id}:`, error);

          await supabase
            .from('sms_messages')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              updated_at: now,
            })
            .eq('id', msg.id);
        }
      }
    }

    // Find stuck emails (status='sending' for >5 minutes)
    const { data: stuckEmails } = await supabase
      .from('email_messages')
      .select('id, to_email')
      .in('status', ['queued', 'sending'])
      .lt('created_at', fiveMinutesAgo)
      .limit(10);

    if (stuckEmails && stuckEmails.length > 0) {
      console.log(`[Background] Found ${stuckEmails.length} stuck emails, retrying...`);

      for (const email of stuckEmails) {
        processed++;
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId: email.id }),
          });

          if (response.ok) {
            succeeded++;
            console.log(`[Background] ✅ Retried email ${email.id} successfully`);
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          failed++;
          console.error(`[Background] ❌ Failed to retry email ${email.id}:`, error);

          await supabase
            .from('email_messages')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              updated_at: now,
            })
            .eq('id', email.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      succeeded,
      failed,
      timestamp: now,
    });
  } catch (error) {
    console.error('[Background] Error in background processor:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds max
