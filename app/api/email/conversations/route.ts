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

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get email threads grouped by conversation_id
    const { data: threads, error } = await supabase
      .from('email_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group messages by conversation_id and create thread summaries
    const threadMap = new Map();

    threads?.forEach((message: any) => {
      const convId = message.conversation_id;
      if (!threadMap.has(convId)) {
        threadMap.set(convId, {
          conversation_id: convId,
          subject: message.subject,
          latest_message: message,
          messages: [message],
          unread_count: message.is_read ? 0 : 1,
        });
      } else {
        const thread = threadMap.get(convId);
        thread.messages.push(message);
        if (!message.is_read) {
          thread.unread_count++;
        }
        // Update latest message if this one is newer
        if (new Date(message.created_at) > new Date(thread.latest_message.created_at)) {
          thread.latest_message = message;
        }
      }
    });

    const threadList = Array.from(threadMap.values()).map((thread) => ({
      conversation_id: thread.conversation_id,
      subject: thread.subject,
      latest_message: thread.latest_message,
      unread_count: thread.unread_count,
      message_count: thread.messages.length,
    }));

    // Sort by latest message date
    threadList.sort((a, b) =>
      new Date(b.latest_message.created_at).getTime() -
      new Date(a.latest_message.created_at).getTime()
    );

    return NextResponse.json({ threads: threadList });
  } catch (error: any) {
    console.error('Error fetching email threads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email threads' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
