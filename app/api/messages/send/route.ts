import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get current user from database
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content, channel_id, dm_id, parent_message_id, mentions, attachments } = body;

    // Validate input
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    if ((!channel_id && !dm_id) || (channel_id && dm_id)) {
      return NextResponse.json(
        { error: 'Message must be sent to either a channel or DM, not both' },
        { status: 400 }
      );
    }

    // If sending to channel, verify membership
    if (channel_id) {
      const { data: membership } = await supabase
        .from('channel_members')
        .select('id')
        .eq('channel_id', channel_id)
        .eq('user_id', currentUser.id)
        .single();

      if (!membership) {
        return NextResponse.json(
          { error: 'You are not a member of this channel' },
          { status: 403 }
        );
      }
    }

    // If sending to DM, verify the DM exists and user is a participant
    if (dm_id) {
      const { data: dm } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('id', dm_id)
        .single();

      if (!dm) {
        return NextResponse.json({ error: 'Direct message conversation not found' }, { status: 404 });
      }

      if (dm.participant_1_id !== currentUser.id && dm.participant_2_id !== currentUser.id) {
        return NextResponse.json(
          { error: 'You are not a participant in this conversation' },
          { status: 403 }
        );
      }
    }

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        content: content.trim(),
        sender_id: currentUser.id,
        channel_id,
        dm_id,
        parent_message_id,
        mentions,
        attachments,
      })
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
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error in send message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
