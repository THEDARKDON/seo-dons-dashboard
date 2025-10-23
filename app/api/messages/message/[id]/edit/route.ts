import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
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

    const { id: messageId } = params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Get message and verify ownership
    const { data: message } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.sender_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'You can only edit your own messages' },
        { status: 403 }
      );
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const messageAge = Date.now() - new Date(message.created_at).getTime();
    const fifteenMinutes = 15 * 60 * 1000;

    if (messageAge > fifteenMinutes) {
      return NextResponse.json(
        { error: 'Message is too old to edit' },
        { status: 403 }
      );
    }

    // Update message
    const { data: updatedMessage, error } = await supabase
      .from('messages')
      .update({
        content: content.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId)
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
      console.error('Error updating message:', error);
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }

    return NextResponse.json(updatedMessage);
  } catch (error: any) {
    console.error('Error in edit message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to edit message' },
      { status: 500 }
    );
  }
}
