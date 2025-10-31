import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch daily tasks for current user
export async function GET(request: NextRequest) {
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

    // Get date from query params or use today
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const taskDate = dateParam || new Date().toISOString().split('T')[0];

    // Fetch daily tasks for the date
    const { data: tasks, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_date', taskDate)
      .order('task_type', { ascending: true });

    if (error) {
      console.error('Error fetching daily tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no tasks exist for today, create them
    if (!tasks || tasks.length === 0) {
      const defaultTasks = [
        { user_id: user.id, task_date: taskDate, task_type: 'calls', target_value: 50 },
        { user_id: user.id, task_date: taskDate, task_type: 'appointments', target_value: 3 },
        { user_id: user.id, task_date: taskDate, task_type: 'linkedin', target_value: null },
        { user_id: user.id, task_date: taskDate, task_type: 'prospecting', target_value: null },
        { user_id: user.id, task_date: taskDate, task_type: 'research', target_value: null },
      ];

      const { data: createdTasks, error: createError } = await supabase
        .from('daily_tasks')
        .insert(defaultTasks)
        .select();

      if (createError) {
        console.error('Error creating daily tasks:', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      return NextResponse.json({ tasks: createdTasks });
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error in daily-tasks GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update task progress or completion
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
    const { task_type, current_value, completed, task_date } = body;

    if (!task_type) {
      return NextResponse.json({ error: 'task_type is required' }, { status: 400 });
    }

    const dateToUse = task_date || new Date().toISOString().split('T')[0];

    // Update the task
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (current_value !== undefined) {
      updateData.current_value = current_value;
    }

    if (completed !== undefined) {
      updateData.completed = completed;
    }

    const { data: updatedTask, error } = await supabase
      .from('daily_tasks')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('task_date', dateToUse)
      .eq('task_type', task_type)
      .select()
      .single();

    if (error) {
      console.error('Error updating daily task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Error in daily-tasks POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Sync task progress from actual data
export async function PATCH(request: NextRequest) {
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

    const today = new Date().toISOString().split('T')[0];
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Count calls made today
    const { count: callCount } = await supabase
      .from('call_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    // Count appointments booked today
    const { count: appointmentCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    // Update calls task
    await supabase
      .from('daily_tasks')
      .update({
        current_value: callCount || 0,
        completed: (callCount || 0) >= 50,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('task_date', today)
      .eq('task_type', 'calls');

    // Update appointments task
    await supabase
      .from('daily_tasks')
      .update({
        current_value: appointmentCount || 0,
        completed: (appointmentCount || 0) >= 3,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('task_date', today)
      .eq('task_type', 'appointments');

    // Fetch updated tasks
    const { data: tasks } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_date', today);

    return NextResponse.json({ tasks, synced: { calls: callCount || 0, appointments: appointmentCount || 0 } });
  } catch (error) {
    console.error('Error in daily-tasks PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
