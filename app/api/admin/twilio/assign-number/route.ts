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

    console.log('🔄 Assigning phone number:', { targetUserId, phoneNumber });

    // STEP 1: Check if this phone number is already assigned to ANYONE
    const { data: existingAssignments } = await supabase
      .from('user_voip_settings')
      .select('user_id, assigned_phone_number')
      .eq('assigned_phone_number', phoneNumber);

    if (existingAssignments && existingAssignments.length > 0) {
      console.log('⚠️ Phone number already assigned to:', existingAssignments);

      // Remove this number from ALL other users
      const otherUserIds = existingAssignments
        .map(a => a.user_id)
        .filter(id => id !== targetUserId);

      if (otherUserIds.length > 0) {
        console.log('🗑️ Removing phone number from other users:', otherUserIds);

        const { error: removeError } = await supabase
          .from('user_voip_settings')
          .update({
            assigned_phone_number: null,
            caller_id_number: null,
            updated_at: new Date().toISOString(),
          })
          .in('user_id', otherUserIds)
          .eq('assigned_phone_number', phoneNumber);

        if (removeError) {
          console.error('Error removing duplicate assignments:', removeError);
        } else {
          console.log('✅ Removed phone number from', otherUserIds.length, 'other users');
        }
      }
    }

    // STEP 2: Check if settings exist for this user
    const { data: existingSettings } = await supabase
      .from('user_voip_settings')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    console.log('Existing settings for user:', existingSettings);

    let data, error;

    if (existingSettings) {
      // Update existing settings
      const result = await supabase
        .from('user_voip_settings')
        .update({
          assigned_phone_number: phoneNumber,
          caller_id_number: callerIdNumber || phoneNumber,
          auto_record: autoRecord !== false,
          auto_transcribe: autoTranscribe !== false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', targetUserId)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      // Insert new settings
      const result = await supabase
        .from('user_voip_settings')
        .insert({
          user_id: targetUserId,
          assigned_phone_number: phoneNumber,
          caller_id_number: callerIdNumber || phoneNumber,
          auto_record: autoRecord !== false,
          auto_transcribe: autoTranscribe !== false,
        })
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error assigning phone number:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Phone number assigned successfully:', { targetUserId, phoneNumber, data });

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
