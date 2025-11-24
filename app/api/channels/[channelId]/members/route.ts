import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Add member to channel
export async function POST(
  request: Request,
  { params }: { params: { channelId: string } }
) {
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

    const { channelId } = params;
    const { user_id } = await request.json();

    // Verify channel exists
    const { data: channel } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Check if user has permission to add members
    const { data: membership } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', channelId)
      .eq('user_id', currentUser.id)
      .single();

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';
    const isChannelAdmin = membership?.role === 'owner' || membership?.role === 'admin';

    if (!isAdmin && !isChannelAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to add members' },
        { status: 403 }
      );
    }

    // Add member
    const { data: newMember, error } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channelId,
        user_id,
        role: 'member',
      })
      .select(`
        *,
        user:users!user_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
      }
      console.error('Error adding member:', error);
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
    }

    return NextResponse.json(newMember);
  } catch (error: any) {
    console.error('Error in add member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add member' },
      { status: 500 }
    );
  }
}

// Get channel members
export async function GET(
  request: Request,
  { params }: { params: { channelId: string } }
) {
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

    const { channelId } = params;

    // Verify user is a member
    const { data: membership } = await supabase
      .from('channel_members')
      .select('id')
      .eq('channel_id', channelId)
      .eq('user_id', currentUser.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this channel' },
        { status: 403 }
      );
    }

    // Get all members
    const { data: members, error } = await supabase
      .from('channel_members')
      .select(`
        *,
        user:users!user_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url,
          role
        )
      `)
      .eq('channel_id', channelId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('Error in get members:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
