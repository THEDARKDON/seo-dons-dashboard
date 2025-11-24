import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { listAvailableUKNumbers } from '@/lib/twilio/client';

/**
 * GET /api/admin/twilio/available-numbers
 * List available UK phone numbers for purchase
 * Admin only
 */
export async function GET(req: Request) {
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

    // Get area code from query params
    const { searchParams } = new URL(req.url);
    const areaCode = searchParams.get('areaCode') || undefined;

    // Fetch available numbers from Twilio
    const response = await listAvailableUKNumbers(areaCode);

    return NextResponse.json({
      success: true,
      numbers: response.available_phone_numbers || [],
      total: response.available_phone_numbers?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching available numbers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch available numbers' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
