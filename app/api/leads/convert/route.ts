import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's Supabase ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { leadId, createDeal, dealValue, dealName } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.status === 'converted') {
      return NextResponse.json({ error: 'Lead already converted' }, { status: 400 });
    }

    // Create customer from lead
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        job_title: lead.job_title,
        website: lead.website,
        linkedin_url: lead.linkedin_url,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        postal_code: lead.postal_code,
        country: lead.country,
        industry: lead.industry,
        notes: lead.notes,
        status: 'active',
      })
      .select()
      .single();

    if (customerError) {
      console.error('Error creating customer:', customerError);
      return NextResponse.json(
        { error: 'Failed to create customer: ' + customerError.message },
        { status: 500 }
      );
    }

    // Update lead to converted status
    await supabase
      .from('leads')
      .update({
        status: 'converted',
        converted_to_customer_id: customer.id,
        converted_at: new Date().toISOString(),
        converted_by: user.id,
      })
      .eq('id', leadId);

    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      user_id: user.id,
      activity_type: 'status_change',
      subject: 'Lead Converted',
      description: `Lead converted to customer: ${customer.first_name} ${customer.last_name}`,
      completed_at: new Date().toISOString(),
    });

    let dealId = null;

    // Create deal if requested
    if (createDeal && dealValue) {
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .insert({
          customer_id: customer.id,
          assigned_to: user.id,
          deal_name: dealName || `Deal with ${customer.first_name} ${customer.last_name}`,
          deal_value: dealValue,
          stage: 'prospecting',
          probability: 25,
          source: `Converted from lead (${lead.lead_source || 'Unknown'})`,
        })
        .select()
        .single();

      if (!dealError && deal) {
        dealId = deal.id;
      }
    }

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      dealId,
      message: 'Lead converted successfully',
    });
  } catch (error: any) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert lead' },
      { status: 500 }
    );
  }
}
