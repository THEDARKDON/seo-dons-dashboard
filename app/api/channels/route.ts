import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Get all channels user is a member of
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

    // Get channels user is a member of
    const { data: channelMembers } = await supabase
      .from('channel_members')
      .select('channel_id, last_read_at')
      .eq('user_id', currentUser.id);

    const channelIds = channelMembers?.map((cm) => cm.channel_id) || [];

    if (channelIds.length === 0) {
      return NextResponse.json({ channels: [] });
    }

    // Get channel details with last message
    const { data: channels, error } = await supabase
      .from('channels')
      .select(`
        *,
        member_count:channel_members(count),
        last_message:messages(
          id,
          content,
          created_at,
          sender:users!sender_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        )
      `)
      .in('id', channelIds)
      .eq('is_archived', false)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching channels:', error);
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }

    // Calculate unread count for each channel
    const channelsWithUnread = await Promise.all(
      (channels || []).map(async (channel) => {
        const memberInfo = channelMembers?.find((cm) => cm.channel_id === channel.id);
        const lastReadAt = memberInfo?.last_read_at;

        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', channel.id)
          .eq('is_deleted', false)
          .gt('created_at', lastReadAt || '1970-01-01');

        return {
          ...channel,
          unread_count: count || 0,
          last_message: Array.isArray(channel.last_message) ? channel.last_message[0] : channel.last_message,
        };
      })
    );

    return NextResponse.json({ channels: channelsWithUnread });
  } catch (error: any) {
    console.error('Error in get channels:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

// Create new channel
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: currentUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { name, description, type, team_id } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
    }

    // Only admins and managers can create channels
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json(
        { error: 'Only admins and managers can create channels' },
        { status: 403 }
      );
    }

    // Create channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .insert({
        name: name.trim(),
        description,
        type: type || 'public',
        team_id,
        created_by: currentUser.id,
      })
      .select()
      .single();

    if (channelError) {
      console.error('Error creating channel:', channelError);
      return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
    }

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channel.id,
        user_id: currentUser.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Error adding creator as member:', memberError);
    }

    return NextResponse.json(channel);
  } catch (error: any) {
    console.error('Error in create channel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create channel' },
      { status: 500 }
    );
  }
}
