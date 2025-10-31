import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ connected: false });
    }

    // Check if user has Gmail integration
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('id, provider, metadata, token_expiry')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      email: integration.metadata?.email,
      expiresAt: integration.token_expiry,
    });
  } catch (error) {
    console.error('Error checking Gmail status:', error);
    return NextResponse.json({ connected: false });
  }
}

export const dynamic = 'force-dynamic';
