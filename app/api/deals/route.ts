import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/deals - Get all deals for current user or filtered by user
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
    const assignedTo = searchParams.get('assignedTo');

    let query = supabase
      .from('deals')
      .select(`
        *,
        customers (id, first_name, last_name, company, email, phone),
        users!deals_assigned_to_fkey (id, first_name, last_name, email)
      `)
      .order('stage_position', { ascending: true })
      .order('created_at', { ascending: false });

    // BDRs see only their own deals, admins/managers can see all or filter by user
    if (user.role === 'bdr') {
      query = query.eq('assigned_to', user.id);
    } else if (assignedTo) {
      // Admin/manager filtering by specific user
      query = query.eq('assigned_to', assignedTo);
    }

    const { data: deals, error } = await query;

    if (error) throw error;

    // Get upcoming appointments for these deals
    if (deals && deals.length > 0) {
      const dealIds = deals.map(d => d.id);
      const { data: appointments } = await supabase
        .from('activities')
        .select('deal_id, scheduled_at, subject')
        .eq('activity_type', 'appointment')
        .in('deal_id', dealIds)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      // Attach the next appointment to each deal
      const dealsWithAppointments = deals.map(deal => {
        const nextAppointment = appointments?.find(apt => apt.deal_id === deal.id);
        return {
          ...deal,
          nextAppointment: nextAppointment || null,
        };
      });

      return NextResponse.json({ deals: dealsWithAppointments || [] });
    }

    return NextResponse.json({ deals: deals || [] });
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}
