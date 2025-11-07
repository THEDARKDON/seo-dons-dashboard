import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sdr_id = searchParams.get('sdr_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    // Build query
    let query = supabase
      .from('mobile_calls_with_details')
      .select('*', { count: 'exact' });

    // If not admin, only show own calls
    if (user.role !== 'admin') {
      query = query.eq('user_id', user.id);
    } else if (sdr_id) {
      // Admin can filter by SDR
      query = query.eq('user_id', sdr_id);
    }

    // Date filters
    if (date_from) {
      query = query.gte('called_at', date_from);
    }
    if (date_to) {
      query = query.lte('called_at', date_to);
    }

    // Pagination and ordering
    query = query
      .order('called_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching mobile calls:', error);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    return NextResponse.json({
      calls: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in GET /api/mobile-calls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.phone_number) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Create call record
    const { data: call, error: callError } = await supabase
      .from('mobile_calls')
      .insert({
        user_id: user.id,
        phone_number: body.phone_number,
        contact_name: body.contact_name,
        call_type: body.call_type || 'mobile',
        direction: body.direction || 'outbound',
        duration_seconds: body.duration_seconds || 0,
        status: body.status || 'completed',
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
        called_at: body.called_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (callError) {
      console.error('Error creating mobile call:', callError);
      return NextResponse.json({ error: 'Failed to create call' }, { status: 500 });
    }

    // Add tags if provided
    if (body.tags && body.tags.length > 0) {
      const tagRelations = body.tags.map((tagId: string) => ({
        mobile_call_id: call.id,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from('mobile_call_tag_relations')
        .insert(tagRelations);

      if (tagError) {
        console.error('Error adding tags:', tagError);
      }
    }

    return NextResponse.json({ call });
  } catch (error) {
    console.error('Error in POST /api/mobile-calls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}