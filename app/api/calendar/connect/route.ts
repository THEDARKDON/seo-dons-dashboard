import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { googleCalendar } from '@/lib/calendar/google-calendar';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate OAuth URL with user ID as state
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
    const authUrl = await googleCalendar.getAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('Error generating Google OAuth URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect calendar' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
