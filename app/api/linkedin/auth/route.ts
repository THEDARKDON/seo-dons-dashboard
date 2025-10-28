import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAuthorizationUrl } from '@/lib/linkedin/client';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate state parameter for CSRF protection
    const state = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store state in session or database for verification
    // For now, we'll verify it in the callback

    // Generate LinkedIn authorization URL
    const authUrl = getAuthorizationUrl(state);

    // Redirect to LinkedIn OAuth page
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Error initiating LinkedIn auth:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate LinkedIn authentication' },
      { status: 500 }
    );
  }
}
