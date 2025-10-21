import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { callSid, toNumber, leadId, customerId, dealId } = body;

    // Get user from database
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's VoIP settings for from number
    const { data: voipSettings } = await supabase
      .from('user_voip_settings')
      .select('assigned_phone_number')
      .eq('user_id', user.id)
      .single();

    const fromNumber = voipSettings?.assigned_phone_number || '+447700158258';

    // Save call to database
    const { data: callRecord, error: dbError } = await supabase
      .from('call_recordings')
      .insert({
        call_sid: callSid,
        user_id: user.id,
        customer_id: customerId || null,
        deal_id: dealId || null,
        lead_id: leadId || null,
        direction: 'outbound',
        from_number: fromNumber,
        to_number: toNumber,
        status: 'initiated',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving call:', dbError);
      return NextResponse.json({ error: 'Failed to save call' }, { status: 500 });
    }

    return NextResponse.json({ success: true, callId: callRecord.id });
  } catch (error: any) {
    console.error('Error in save-call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save call' },
      { status: 500 }
    );
  }
}
