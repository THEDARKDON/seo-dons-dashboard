import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/messages/unified
 * Returns unified messages from internal messages, SMS, and emails
 * Query params:
 *  - conversationId: ID of the conversation/thread
 *  - type: 'sms' | 'email' | 'internal' | 'all'
 *  - limit: number of messages to return (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = await createClient();

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allMessages: any[] = [];

    // Fetch internal messages if requested
    if (type === 'all' || type === 'internal') {
      if (conversationId) {
        const { data: internalMessages } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!sender_id (
              id,
              first_name,
              last_name,
              email,
              avatar_url
            )
          `)
          .eq('dm_id', conversationId)
          .eq('is_deleted', false)
          .is('parent_message_id', null)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (internalMessages) {
          allMessages.push(
            ...internalMessages.map((msg) => ({
              ...msg,
              message_type: 'internal',
              sender_name: msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Unknown',
            }))
          );
        }
      }
    }

    // Fetch SMS messages if requested
    if (type === 'all' || type === 'sms') {
      if (conversationId) {
        const { data: smsMessages } = await supabase
          .from('sms_messages')
          .select('*')
          .eq('user_id', user.id)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (smsMessages) {
          allMessages.push(
            ...smsMessages.map((msg) => ({
              id: msg.id,
              content: msg.body,
              created_at: msg.created_at,
              message_type: 'sms',
              direction: msg.direction,
              sender_name: msg.direction === 'inbound' ? msg.from_number : 'You',
              from_number: msg.from_number,
              to_number: msg.to_number,
              status: msg.status,
              is_read: msg.is_read,
            }))
          );
        }

        // Mark inbound SMS as read
        const unreadSmsIds = smsMessages
          ?.filter((m) => !m.is_read && m.direction === 'inbound')
          .map((m) => m.id);

        if (unreadSmsIds && unreadSmsIds.length > 0) {
          await supabase
            .from('sms_messages')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in('id', unreadSmsIds);
        }
      }
    }

    // Fetch email messages if requested
    if (type === 'all' || type === 'email') {
      if (conversationId) {
        const { data: emailMessages } = await supabase
          .from('email_messages')
          .select('*')
          .eq('user_id', user.id)
          .eq('thread_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (emailMessages) {
          allMessages.push(
            ...emailMessages.map((msg) => ({
              id: msg.id,
              content: msg.body_text || msg.body_html,
              created_at: msg.created_at,
              message_type: 'email',
              direction: msg.direction,
              sender_name: msg.direction === 'inbound' ? msg.from_email : 'You',
              subject: msg.subject,
              from_email: msg.from_email,
              to_email: msg.to_email,
              is_read: msg.is_read,
            }))
          );
        }

        // Mark inbound emails as read
        const unreadEmailIds = emailMessages
          ?.filter((m) => !m.is_read && m.direction === 'inbound')
          .map((m) => m.id);

        if (unreadEmailIds && unreadEmailIds.length > 0) {
          await supabase
            .from('email_messages')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in('id', unreadEmailIds);
        }
      }
    }

    // Sort all messages by created_at
    allMessages.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Limit total results
    const limitedMessages = allMessages.slice(-limit);

    return NextResponse.json({
      messages: limitedMessages,
      hasMore: allMessages.length > limit,
      totalCount: allMessages.length,
    });
  } catch (error: any) {
    console.error('Error fetching unified messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
