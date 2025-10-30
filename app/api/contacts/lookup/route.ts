import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Try to find lead by phone number
    const { data: lead } = await supabase
      .from('leads')
      .select('id, name, email, phone')
      .eq('phone', phone)
      .single();

    if (lead) {
      return NextResponse.json({
        type: 'lead',
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
      });
    }

    // Try to find customer by phone number
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .eq('phone', phone)
      .single();

    if (customer) {
      return NextResponse.json({
        type: 'customer',
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      });
    }

    // No contact found
    return NextResponse.json({
      type: 'unknown',
      phone: phone,
    });
  } catch (error) {
    console.error('Error looking up contact:', error);
    return NextResponse.json(
      { error: 'Failed to lookup contact' },
      { status: 500 }
    );
  }
}
