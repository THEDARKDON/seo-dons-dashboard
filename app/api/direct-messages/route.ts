import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Get all DM conversations for current user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all DMs where user is a participant
    const { data: dms, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`participant_1_id.eq.${currentUser.id},participant_2_id.eq.${currentUser.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching DMs:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Enrich with other participant info and last message
    const enrichedDms = await Promise.all(
      (dms || []).map(async (dm) => {
        const otherParticipantId =
          dm.participant_1_id === currentUser.id ? dm.participant_2_id : dm.participant_1_id;

        // Get other participant
        const { data: otherParticipant } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, avatar_url')
          .eq('id', otherParticipantId)
          .single();

        // Get last message
        const { data: lastMessage } = await supabase
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
          .eq('dm_id', dm.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Count unread messages
        const lastReadTimestamp = dm.last_message_at || '1970-01-01';
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('dm_id', dm.id)
          .eq('is_deleted', false)
          .neq('sender_id', currentUser.id)
          .gt('created_at', lastReadTimestamp);

        return {
          ...dm,
          other_participant: otherParticipant,
          last_message: lastMessage,
          unread_count: unreadCount || 0,
        };
      })
    );

    return NextResponse.json({ conversations: enrichedDms });
  } catch (error: any) {
    console.error('Error in get DMs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// Create or get existing DM conversation
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { other_user_id } = await request.json();

    if (!other_user_id) {
      return NextResponse.json({ error: 'Other user ID is required' }, { status: 400 });
    }

    if (other_user_id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot create DM with yourself' }, { status: 400 });
    }

    // Check if other user exists
    const { data: otherUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', other_user_id)
      .single();

    if (!otherUser) {
      return NextResponse.json({ error: 'Other user not found' }, { status: 404 });
    }

    // Order participant IDs to maintain constraint
    const [participant1, participant2] = [currentUser.id, other_user_id].sort();

    // Check if DM already exists
    const { data: existingDm } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('participant_1_id', participant1)
      .eq('participant_2_id', participant2)
      .single();

    if (existingDm) {
      return NextResponse.json({ conversation: existingDm, existed: true });
    }

    // Create new DM
    const { data: newDm, error } = await supabase
      .from('direct_messages')
      .insert({
        participant_1_id: participant1,
        participant_2_id: participant2,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating DM:', error);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json({ conversation: newDm, existed: false });
  } catch (error: any) {
    console.error('Error in create DM:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
