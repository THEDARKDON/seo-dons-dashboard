import { NextRequest, NextResponse } from 'next/server';
import { googleCalendar } from '@/lib/calendar/google-calendar';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('[calendar/callback] Received OAuth callback:', { code: !!code, state: !!state, error });

    if (error) {
      console.error('[calendar/callback] Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard/settings?calendar_error=' + encodeURIComponent(error), req.url)
      );
    }

    if (!code || !state) {
      console.error('[calendar/callback] Missing code or state');
      return NextResponse.redirect(
        new URL('/dashboard/settings?calendar_error=missing_params', req.url)
      );
    }

    // Decode state to get user ID
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const userId = decodedState.userId;
    console.log('[calendar/callback] Decoded user ID:', userId);

    if (!userId) {
      console.error('[calendar/callback] Invalid state - no user ID');
      return NextResponse.redirect(
        new URL('/dashboard/settings?calendar_error=invalid_state', req.url)
      );
    }

    // Handle OAuth callback
    console.log('[calendar/callback] Calling handleCallback...');
    await googleCalendar.handleCallback(code, userId);
    console.log('[calendar/callback] Successfully saved calendar integration');

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL('/dashboard/settings?calendar_connected=true', req.url)
    );
  } catch (error: any) {
    console.error('[calendar/callback] Error handling Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?calendar_error=' + encodeURIComponent(error.message), req.url)
    );
  }
}

export const dynamic = 'force-dynamic';
