import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get latest message per conversation
    const { data: conversations, error } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Group by conversation_id and get latest message + unread count
    const conversationMap = new Map();

    conversations?.forEach((msg) => {
      if (!conversationMap.has(msg.conversation_id)) {
        conversationMap.set(msg.conversation_id, {
          conversation_id: msg.conversation_id,
          latest_message: msg,
          unread_count: 0,
          messages: [],
        });
      }

      const conv = conversationMap.get(msg.conversation_id);
      conv.messages.push(msg);

      if (!msg.is_read && msg.direction === 'inbound') {
        conv.unread_count++;
      }
    });

    // Convert to array and sort by latest message
    const result = Array.from(conversationMap.values())
      .map((conv) => ({
        conversation_id: conv.conversation_id,
        latest_message: conv.latest_message,
        unread_count: conv.unread_count,
        message_count: conv.messages.length,
      }))
      .sort((a, b) =>
        new Date(b.latest_message.created_at).getTime() -
        new Date(a.latest_message.created_at).getTime()
      );

    return NextResponse.json({ conversations: result });
  } catch (error: any) {
    console.error('Error fetching SMS conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
