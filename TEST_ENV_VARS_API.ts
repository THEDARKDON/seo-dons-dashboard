// TEMPORARY DIAGNOSTIC FILE
// Create this at: app/api/test-env/route.ts
// Visit: https://your-domain.vercel.app/api/test-env
// DELETE THIS FILE AFTER TESTING!

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    // Test Clerk auth
    const { userId } = await auth();

    // Test env vars
    const envCheck = {
      // Check if variables exist (don't expose actual values!)
      clerk: {
        hasPublicKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        hasSecretKey: !!process.env.CLERK_SECRET_KEY,
        hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
        publicKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 8),
      },
      supabase: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
      },
      auth: {
        isAuthenticated: !!userId,
        userIdPrefix: userId?.substring(0, 10) || 'NOT_LOGGED_IN',
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(envCheck);
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack?.substring(0, 500),
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
