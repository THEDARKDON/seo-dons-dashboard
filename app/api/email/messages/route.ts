import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('thread');

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread parameter is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get messages in thread
    const { data: messages, error } = await supabase
      .from('email_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('conversation_id', threadId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark messages as read
    const unreadIds = messages
      ?.filter((m) => !m.is_read && m.direction === 'inbound')
      .map((m) => m.id);

    if (unreadIds && unreadIds.length > 0) {
      await supabase
        .from('email_messages')
        .update({ is_read: true })
        .in('id', unreadIds);
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error: any) {
    console.error('Error fetching email messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
