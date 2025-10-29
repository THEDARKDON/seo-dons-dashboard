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

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversation parameter' },
        { status: 400 }
      );
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

    // Get messages in conversation
    const { data: messages, error } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Mark inbound messages as read
    const unreadIds = messages
      ?.filter((m) => !m.is_read && m.direction === 'inbound')
      .map((m) => m.id);

    if (unreadIds && unreadIds.length > 0) {
      await supabase
        .from('sms_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error: any) {
    console.error('Error fetching SMS messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
