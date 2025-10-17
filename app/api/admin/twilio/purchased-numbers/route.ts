import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Get all purchased phone numbers from Twilio
 * Admin only endpoint
 */
export async function GET() {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch purchased numbers from Twilio
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    if (!twilioAccountSid || !twilioAuthToken) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/IncomingPhoneNumbers.json`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio API error: ${error}`);
    }

    const data = await response.json();

    // Get all assigned numbers from database
    const { data: voipSettings } = await supabase
      .from('user_voip_settings')
      .select('assigned_phone_number, user_id, users(first_name, last_name, email)');

    // Create a map of assigned numbers
    const assignedMap = new Map();
    voipSettings?.forEach((setting: any) => {
      if (setting.assigned_phone_number) {
        assignedMap.set(setting.assigned_phone_number, {
          userId: setting.user_id,
          userName: `${setting.users?.first_name || ''} ${setting.users?.last_name || ''}`.trim() || setting.users?.email,
        });
      }
    });

    // Map Twilio numbers with assignment info
    const numbers = data.incoming_phone_numbers.map((num: any) => ({
      phoneNumber: num.phone_number,
      friendlyName: num.friendly_name,
      sid: num.sid,
      capabilities: {
        voice: num.capabilities.voice,
        sms: num.capabilities.sms,
      },
      assigned: assignedMap.has(num.phone_number),
      assignedTo: assignedMap.get(num.phone_number),
    }));

    return NextResponse.json({ numbers, total: numbers.length });
  } catch (error: any) {
    console.error('Error fetching purchased numbers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchased numbers' },
      { status: 500 }
    );
  }
}
