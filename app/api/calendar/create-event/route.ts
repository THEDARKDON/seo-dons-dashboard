import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { googleCalendar } from '@/lib/calendar/google-calendar';
import { createClient } from '@/lib/supabase/server';
import { addMinutes } from 'date-fns';

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerEmail,
      customerName,
      startTime,
      duration, // in minutes
      title,
      description,
      callRecordId,
      customerId,
      dealId,
      leadId,
    } = body;

    if (!customerEmail || !startTime || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('clerk_id', clerkUserId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if calendar is connected
    const isConnected = await googleCalendar.isConnected(user.id);
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = addMinutes(start, duration);

    // Create appointment in activities table
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        customer_id: customerId || null,
        deal_id: dealId || null,
        lead_id: leadId || null,
        activity_type: 'appointment',
        title: title || `Meeting with ${customerName || customerEmail}`,
        description: description || `Follow-up meeting scheduled after call`,
        scheduled_at: start.toISOString(),
        status: 'scheduled',
      })
      .select()
      .single();

    if (activityError || !activity) {
      console.error('Error creating activity:', activityError);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    // Create Google Calendar event
    const event = await googleCalendar.createEvent(user.id, {
      summary: title || `Meeting with ${customerName || customerEmail}`,
      description: description || `Follow-up meeting scheduled after call\n\nSDR: ${user.first_name} ${user.last_name}\nCustomer: ${customerName || customerEmail}`,
      startTime: start,
      endTime: end,
      attendees: [customerEmail],
      activityId: activity.id,
      callRecordId,
    });

    return NextResponse.json({
      success: true,
      activityId: activity.id,
      calendarEventId: event.id,
      calendarEventLink: event.htmlLink,
    });
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}
