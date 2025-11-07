import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the mobile call
    let query = supabase
      .from('mobile_calls_with_details')
      .select('*')
      .eq('id', params.id)
      .single();

    const { data: call, error } = await query;

    if (error || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Check permissions
    if (user.role !== 'admin' && call.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ call });
  } catch (error) {
    console.error('Error in GET /api/mobile-calls/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if call exists and user has permission
    const { data: existingCall } = await supabase
      .from('mobile_calls')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!existingCall) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && existingCall.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Update call record
    const { data: call, error: updateError } = await supabase
      .from('mobile_calls')
      .update({
        phone_number: body.phone_number,
        contact_name: body.contact_name,
        call_type: body.call_type,
        direction: body.direction,
        duration_seconds: body.duration_seconds,
        status: body.status,
        outcome: body.outcome,
        notes: body.notes,
        follow_up_date: body.follow_up_date,
        follow_up_notes: body.follow_up_notes,
        location_name: body.location_name,
        latitude: body.latitude,
        longitude: body.longitude,
        customer_id: body.customer_id,
        deal_id: body.deal_id,
        lead_id: body.lead_id,
        called_at: body.called_at,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating mobile call:', updateError);
      return NextResponse.json({ error: 'Failed to update call' }, { status: 500 });
    }

    // Update tags if provided
    if (body.tags !== undefined) {
      // Remove existing tags
      await supabase
        .from('mobile_call_tag_relations')
        .delete()
        .eq('mobile_call_id', params.id);

      // Add new tags
      if (body.tags && body.tags.length > 0) {
        const tagRelations = body.tags.map((tagId: string) => ({
          mobile_call_id: params.id,
          tag_id: tagId,
        }));

        const { error: tagError } = await supabase
          .from('mobile_call_tag_relations')
          .insert(tagRelations);

        if (tagError) {
          console.error('Error updating tags:', tagError);
        }
      }
    }

    return NextResponse.json({ call });
  } catch (error) {
    console.error('Error in PUT /api/mobile-calls/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if call exists and user has permission
    const { data: existingCall } = await supabase
      .from('mobile_calls')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!existingCall) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && existingCall.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the call (tags will be deleted automatically due to CASCADE)
    const { error: deleteError } = await supabase
      .from('mobile_calls')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting mobile call:', deleteError);
      return NextResponse.json({ error: 'Failed to delete call' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/mobile-calls/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}