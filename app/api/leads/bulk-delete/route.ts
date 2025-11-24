import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { leadIds } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
    }

    console.log('[Bulk Delete] Deleting leads:', {
      count: leadIds.length,
      userId: user.id,
      role: user.role,
      leadIds
    });

    // Admin can delete any leads, regular users can only delete their own
    let query = supabase
      .from('leads')
      .delete()
      .in('id', leadIds);

    if (user.role !== 'admin') {
      query = query.eq('assigned_to', user.id);
    }

    const { error: deleteError, count } = await query;

    if (deleteError) {
      console.error('[Bulk Delete] Error:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete leads' },
        { status: 500 }
      );
    }

    console.log('[Bulk Delete] Successfully deleted', count, 'leads');

    return NextResponse.json({
      success: true,
      deletedCount: count || leadIds.length,
    });
  } catch (error: any) {
    console.error('[Bulk Delete] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete leads' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
