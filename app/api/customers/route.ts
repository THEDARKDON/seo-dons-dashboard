import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/customers - Get all customers for current user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { searchParams } = new URL(request.url);
    const ownedBy = searchParams.get('ownedBy');

    let query = supabase
      .from('customers')
      .select(`
        *,
        deals (id, deal_name, deal_value, stage)
      `)
      .order('created_at', { ascending: false });

    // BDRs can only see their own customers
    if (user.role === 'bdr') {
      query = query.eq('owned_by', user.id);
    } else if (ownedBy) {
      // Admins/managers can filter by specific SDR
      query = query.eq('owned_by', ownedBy);
    }

    const { data: customers, error } = await query;

    if (error) throw error;

    return NextResponse.json({ customers: customers || [] });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
