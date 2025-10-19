import { NextRequest, NextResponse } from 'next/server';
import { googleCalendar } from '@/lib/calendar/google-calendar';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard/settings?calendar_error=' + encodeURIComponent(error), req.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?calendar_error=missing_params', req.url)
      );
    }

    // Decode state to get user ID
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const userId = decodedState.userId;

    if (!userId) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?calendar_error=invalid_state', req.url)
      );
    }

    // Handle OAuth callback
    await googleCalendar.handleCallback(code, userId);

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL('/dashboard/settings?calendar_connected=true', req.url)
    );
  } catch (error: any) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?calendar_error=' + encodeURIComponent(error.message), req.url)
    );
  }
}

export const dynamic = 'force-dynamic';
