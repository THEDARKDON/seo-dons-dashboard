import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { to, subject, htmlBody, textBody, leadId, customerId, callId } = body;

    if (!to || !subject || (!htmlBody && !textBody)) {
      return NextResponse.json(
        { error: 'To, subject, and body are required' },
        { status: 400 }
      );
    }

    // Get user's Google OAuth tokens
    const { data: googleAuth } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token, token_expiry')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (!googleAuth) {
      return NextResponse.json(
        { error: 'Google account not connected. Please connect in settings.' },
        { status: 400 }
      );
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
        .eq('user_id', user.id)
        .eq('provider', 'google');
    }

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email message
    const emailLines = [
      `From: ${user.first_name} ${user.last_name} <${user.email}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody || textBody,
    ];

    const email = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(email)
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

    // Store email in database
    const { data: emailMessage, error: dbError } = await supabase
      .from('email_messages')
      .insert({
        user_id: user.id,
        from_email: user.email,
        to_email: to,
        subject,
        body: htmlBody || textBody,
        direction: 'outbound',
        status: 'sent',
        gmail_message_id: response.data.id,
        gmail_thread_id: response.data.threadId,
        conversation_id: to,
        call_id: callId || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to store email in database:', dbError);
    }

    return NextResponse.json({
      success: true,
      messageId: response.data.id,
      threadId: response.data.threadId,
      emailId: emailMessage?.id,
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
