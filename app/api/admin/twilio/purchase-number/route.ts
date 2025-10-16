import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { purchasePhoneNumber } from '@/lib/twilio/client';

/**
 * POST /api/admin/twilio/purchase-number
 * Purchase a phone number from Twilio
 * Admin only
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Purchase the number from Twilio
    const twilioResponse = await purchasePhoneNumber(phoneNumber);

    console.log('✅ Phone number purchased:', phoneNumber);

    return NextResponse.json({
      success: true,
      message: 'Phone number purchased successfully',
      data: {
        phoneNumber: twilioResponse.phone_number,
        sid: twilioResponse.sid,
        friendlyName: twilioResponse.friendly_name,
      },
    });
  } catch (error: any) {
    console.error('Error purchasing number:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to purchase number' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
