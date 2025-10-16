import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const supabase = await createClient();

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if lead exists and user has access
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, assigned_to')
      .eq('id', id)
      .single();

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check access - BDRs can only edit their own leads
    if (user.role === 'bdr' && existingLead.assigned_to !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update lead
    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: id,
      user_id: user.id,
      activity_type: 'note',
      subject: 'Lead Updated',
      description: 'Lead information was updated',
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error in PATCH /api/leads/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if lead exists and user has access
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, assigned_to')
      .eq('id', id)
      .single();

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Only admins and managers can delete leads
    if (user.role === 'bdr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete lead
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lead:', error);
      return NextResponse.json(
        { error: 'Failed to delete lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/leads/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
