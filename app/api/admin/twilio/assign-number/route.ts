import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/twilio/assign-number
 * Assign a phone number to a user
 * Admin only
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, phoneNumber, callerIdNumber, autoRecord, autoTranscribe } = body;

    if (!targetUserId || !phoneNumber) {
      return NextResponse.json(
        { error: 'User ID and phone number are required' },
        { status: 400 }
      );
    }

    // Upsert VoIP settings for the user
    const { data, error } = await supabase
      .from('user_voip_settings')
      .upsert(
        {
          user_id: targetUserId,
          assigned_phone_number: phoneNumber,
          caller_id_number: callerIdNumber || phoneNumber,
          auto_record: autoRecord !== false,
          auto_transcribe: autoTranscribe !== false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error assigning phone number:', error);
      throw error;
    }

    console.log('✅ Phone number assigned:', { targetUserId, phoneNumber });

    return NextResponse.json({
      success: true,
      message: 'Phone number assigned successfully',
      data,
    });
  } catch (error: any) {
    console.error('Error assigning number:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign number' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
