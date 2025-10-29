import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if requesting user is admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', clerkUserId)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can change user roles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role } = body;

    // Validate role
    const validRoles = ['admin', 'manager', 'bdr', 'sdr'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Get target user
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('id', params.id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admins from demoting themselves
    if (adminUser.id === targetUser.id && role !== 'admin') {
      return NextResponse.json(
        { error: 'You cannot change your own admin role' },
        { status: 400 }
      );
    }

    // Update user role
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully changed ${targetUser.first_name} ${targetUser.last_name}'s role to ${role}`,
      user: {
        id: targetUser.id,
        name: `${targetUser.first_name} ${targetUser.last_name}`,
        email: targetUser.email,
        oldRole: targetUser.role,
        newRole: role,
      },
    });
  } catch (error: any) {
    console.error('Error changing user role:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change user role' },
      { status: 500 }
    );
  }
}
