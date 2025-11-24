import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Full Authentication Debug Endpoint
 * Visit: /api/debug-full-auth (while logged in)
 * Shows complete auth flow with detailed logging
 */
export async function GET() {
  const logs: any[] = [];

  try {
    logs.push({ step: 1, name: 'Starting debug', timestamp: new Date().toISOString() });

    // Step 1: Check Clerk Authentication
    logs.push({ step: 2, name: 'Calling Clerk auth()' });
    const { userId, sessionId } = await auth();
    logs.push({
      step: 3,
      name: 'Clerk auth result',
      userId,
      sessionId,
      hasUserId: !!userId,
      hasSessionId: !!sessionId,
      userIdType: typeof userId,
      userIdLength: userId?.length,
    });

    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated with Clerk',
        logs,
      }, { status: 401 });
    }

    // Step 2: Create Supabase Client
    logs.push({ step: 4, name: 'Creating Supabase client' });
    const supabase = await createClient();
    logs.push({ step: 5, name: 'Supabase client created' });

    // Step 3: Test basic Supabase connection
    logs.push({ step: 6, name: 'Testing Supabase connection' });
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    logs.push({
      step: 7,
      name: 'Supabase connection test',
      success: !testError,
      error: testError?.message,
    });

    if (testError) {
      return NextResponse.json({
        error: 'Supabase connection failed',
        details: testError,
        logs,
      }, { status: 500 });
    }

    // Step 4: Get total user count
    logs.push({ step: 8, name: 'Getting total user count' });
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    logs.push({
      step: 9,
      name: 'Total users in database',
      totalUsers,
    });

    // Step 5: Try to find user by clerk_id
    logs.push({
      step: 10,
      name: 'Looking up user by clerk_id',
      lookingFor: userId,
    });

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, email, first_name, last_name, role, active, created_at')
      .eq('clerk_id', userId)
      .maybeSingle();

    logs.push({
      step: 11,
      name: 'User lookup result',
      found: !!user,
      error: userError?.message,
      errorCode: userError?.code,
      errorHint: userError?.hint,
      errorDetails: userError?.details,
    });

    if (userError) {
      return NextResponse.json({
        error: 'Database query failed',
        details: userError,
        logs,
      }, { status: 500 });
    }

    if (!user) {
      // User not found - get diagnostic info
      logs.push({ step: 12, name: 'User not found - getting diagnostics' });

      // Get sample users
      const { data: sampleUsers } = await supabase
        .from('users')
        .select('id, clerk_id, email, active')
        .limit(10);

      logs.push({
        step: 13,
        name: 'Sample users from database',
        sampleUsers: sampleUsers?.map(u => ({
          id: u.id,
          email: u.email,
          clerk_id: u.clerk_id,
          clerk_id_length: u.clerk_id?.length,
          active: u.active,
          matches: u.clerk_id === userId,
        })),
      });

      // Check if any clerk_id partially matches
      const partialMatches = sampleUsers?.filter(u =>
        u.clerk_id?.includes(userId?.substring(0, 10) || '') ||
        userId?.includes(u.clerk_id?.substring(0, 10) || '')
      );

      logs.push({
        step: 14,
        name: 'Partial matches check',
        partialMatches: partialMatches?.length || 0,
        matches: partialMatches,
      });

      return NextResponse.json({
        error: 'User not found in database',
        clerkUserId: userId,
        totalUsersInDb: totalUsers,
        diagnosis: {
          clerkAuthWorking: true,
          supabaseConnectionWorking: true,
          userExistsInClerk: true,
          userExistsInSupabase: false,
          possibleCauses: [
            'User was never synced from Clerk to Supabase',
            'Clerk ID in database does not match current Clerk ID',
            'User was deleted from Supabase but still exists in Clerk',
            'Webhook failed to create user when they signed up',
          ],
        },
        logs,
      }, { status: 404 });
    }

    // Success - user found
    logs.push({
      step: 15,
      name: 'User found successfully',
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        clerk_id: user.clerk_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        active: user.active,
        created_at: user.created_at,
      },
      clerk_id_match: user.clerk_id === userId,
      logs,
    });

  } catch (error: any) {
    logs.push({
      step: 'error',
      name: 'Uncaught error',
      error: error.message,
      stack: error.stack?.substring(0, 500),
    });

    console.error('Full auth debug error:', error);

    return NextResponse.json({
      error: 'Unexpected error',
      message: error.message,
      logs,
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
