import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { googleCalendar } from '@/lib/calendar/google-calendar';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

    // Check if calendar is connected
    const isConnected = await googleCalendar.isConnected(user.id);

    if (!isConnected) {
      return NextResponse.json({ connected: false });
    }

    // Get integration details
    const integration = await googleCalendar.getIntegration(user.id);

    return NextResponse.json({
      connected: true,
      email: integration?.email,
      calendarId: integration?.calendar_id,
      connectedAt: integration?.created_at,
    });
  } catch (error: any) {
    console.error('Error checking calendar status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check calendar status' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
