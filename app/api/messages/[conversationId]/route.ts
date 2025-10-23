import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get current user
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { conversationId } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'channel' or 'dm'
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Message ID for pagination

    // Verify access and fetch messages
    let query = supabase
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
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type === 'channel') {
      // Verify channel membership
      const { data: membership } = await supabase
        .from('channel_members')
        .select('id')
        .eq('channel_id', conversationId)
        .eq('user_id', currentUser.id)
        .single();

      if (!membership) {
        return NextResponse.json(
          { error: 'You are not a member of this channel' },
          { status: 403 }
        );
      }

      query = query.eq('channel_id', conversationId).is('parent_message_id', null);
    } else if (type === 'dm') {
      // Verify DM participation
      const { data: dm } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (!dm) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      if (dm.participant_1_id !== currentUser.id && dm.participant_2_id !== currentUser.id) {
        return NextResponse.json(
          { error: 'You are not a participant in this conversation' },
          { status: 403 }
        );
      }

      query = query.eq('dm_id', conversationId).is('parent_message_id', null);
    } else {
      return NextResponse.json({ error: 'Invalid conversation type' }, { status: 400 });
    }

    // Pagination
    if (before) {
      const { data: beforeMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('id', before)
        .single();

      if (beforeMessage) {
        query = query.lt('created_at', beforeMessage.created_at);
      }
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Reverse to show oldest first
    const sortedMessages = messages?.reverse() || [];

    return NextResponse.json({
      messages: sortedMessages,
      hasMore: messages?.length === limit,
    });
  } catch (error: any) {
    console.error('Error in get messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
