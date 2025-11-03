import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/admin/leads/bulk-assign - Bulk assign leads to an SDR
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Verify admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { leadIds, assignToUserId } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
    }

    if (!assignToUserId) {
      return NextResponse.json({ error: 'Assign to user ID is required' }, { status: 400 });
    }

    // Verify the target user exists
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', assignToUserId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Bulk update the leads
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        assigned_to: assignToUserId,
        assigned_at: new Date().toISOString(),
      })
      .in('id', leadIds);

    if (updateError) {
      console.error('Error bulk assigning leads:', updateError);
      return NextResponse.json({ error: 'Failed to assign leads' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      assignedCount: leadIds.length,
      message: `Successfully assigned ${leadIds.length} leads`,
    });
  } catch (error: any) {
    console.error('Error in bulk assign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign leads' },
      { status: 500 }
    );
  }
}
