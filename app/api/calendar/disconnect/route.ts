import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { googleCalendar } from '@/lib/calendar/google-calendar';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Disconnect calendar
    await googleCalendar.disconnect(user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error disconnecting calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect calendar' },
      { status: 500 }
    );
  }
}
