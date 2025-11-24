import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify webhook configuration
 * Visit: https://www.seodonscrm.co.uk/api/webhook/clerk/test
 */
export async function GET() {
  const hasSecret = !!process.env.CLERK_WEBHOOK_SECRET;
  const secretPreview = process.env.CLERK_WEBHOOK_SECRET
    ? process.env.CLERK_WEBHOOK_SECRET.substring(0, 10) + '...'
    : 'NOT SET';

  return NextResponse.json({
    status: 'Webhook endpoint is reachable',
    configuration: {
      hasWebhookSecret: hasSecret,
      secretPreview: secretPreview,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
    },
    instructions: hasSecret
      ? '✅ Webhook secret is configured. Create a test user in Clerk to test the webhook.'
      : '❌ CLERK_WEBHOOK_SECRET is missing! Add it to Vercel environment variables.',
  });
}

export const dynamic = 'force-dynamic';
