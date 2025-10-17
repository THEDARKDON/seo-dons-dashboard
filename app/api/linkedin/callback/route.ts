import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAccessToken, getUserProfile } from '@/lib/linkedin/client';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(
        new URL('/sign-in?error=unauthorized', req.url)
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/social?error=${error}`, req.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/social?error=missing_params', req.url)
      );
    }

    const supabase = await createClient();

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.redirect(
        new URL('/dashboard/social?error=user_not_found', req.url)
      );
    }

    // Verify state parameter (basic check - in production, store and verify properly)
    if (!state.startsWith(user.id)) {
      return NextResponse.redirect(
        new URL('/dashboard/social?error=invalid_state', req.url)
      );
    }

    // Exchange code for access token
    const tokenData = await getAccessToken(code);

    // Get LinkedIn user profile
    const profile = await getUserProfile(tokenData.accessToken);

    // Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expiresIn);

    // Store LinkedIn connection in database
    const { error: dbError } = await supabase
      .from('linkedin_connections')
      .upsert({
        user_id: user.id,
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        token_expires_at: expiresAt.toISOString(),
        linkedin_user_id: profile.sub,
        linkedin_email: profile.email,
        profile_name: profile.name,
        profile_picture_url: profile.picture,
        active: true,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (dbError) {
      console.error('Error storing LinkedIn connection:', dbError);
      return NextResponse.redirect(
        new URL('/dashboard/social?error=storage_failed', req.url)
      );
    }

    // Redirect to social media dashboard with success
    return NextResponse.redirect(
      new URL('/dashboard/social?success=true', req.url)
    );
  } catch (error: any) {
    console.error('Error handling LinkedIn callback:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/social?error=${encodeURIComponent(error.message)}`, req.url)
    );
  }
}
