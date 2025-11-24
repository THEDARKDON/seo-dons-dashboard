import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { ACTIVE_STAGES } from '@/lib/constants/pipeline-stages';

export default async function DashboardPage() {
  console.log('=== DASHBOARD PAGE START ===');
  console.log('Timestamp:', new Date().toISOString());

  const { userId } = await auth();
  console.log('🔐 Clerk Auth Result:', {
    userId,
    userIdType: typeof userId,
    userIdLength: userId?.length,
    hasUserId: !!userId,
  });

  const supabase = await createClient();
  console.log('📊 Supabase client created');

  // Log the exact query being executed
  console.log('🔍 Looking up user with clerk_id:', userId);

  const { data: user, error: userError, count } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, role, clerk_id', { count: 'exact' })
    .eq('clerk_id', userId)
    .single();

  console.log('👤 User Lookup Result:', {
    found: !!user,
    error: userError?.message,
    errorCode: userError?.code,
    errorDetails: userError?.details,
    errorHint: userError?.hint,
    count,
    userData: user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      clerk_id_matches: user.clerk_id === userId,
      clerk_id_in_db: user.clerk_id,
      clerk_id_from_clerk: userId,
    } : null,
  });

  // If user not found, try to get diagnostic info
  if (!user) {
    console.error('❌ USER NOT FOUND - Running diagnostics...');

    // Check if ANY users exist
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('id, clerk_id, email')
      .limit(5);

    console.error('📋 Sample users in database:', {
      totalSample: allUsers?.length || 0,
      error: allError?.message,
      sampleUsers: allUsers?.map(u => ({
        id: u.id,
        email: u.email,
        clerk_id: u.clerk_id,
        clerk_id_length: u.clerk_id?.length,
      })),
    });

    // Check if clerk_id might have changed
    console.error('🔎 Clerk ID comparison:', {
      lookingFor: userId,
      lengthLookingFor: userId?.length,
      sampleClerkIds: allUsers?.map(u => u.clerk_id),
    });

    console.error('=== DASHBOARD PAGE END (USER NOT FOUND) ===');
    return <div>User not found</div>;
  }

  console.log('✅ User found successfully, continuing to load dashboard...');

  // Get current month's start date
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get total revenue from closed deals this month
  const { data: deals } = await supabase
    .from('deals')
    .select('deal_value, stage')
    .eq('assigned_to', user.id)
    .eq('stage', 'closed_won')
    .gte('actual_close_date', monthStart.toISOString());

  const totalRevenue = deals?.reduce((sum, deal) => sum + Number(deal.deal_value), 0) || 0;

  // Get active deals
  const { data: activeDeals } = await supabase
    .from('deals')
    .select('id, stage, deal_value')
    .eq('assigned_to', user.id)
    .in('stage', ACTIVE_STAGES);

  const pipelineValue = activeDeals?.reduce((sum, deal) => sum + Number(deal.deal_value), 0) || 0;

  // Get recent calls
  const { data: recentCalls } = await supabase
    .from('call_recordings')
    .select(`
      *,
      customers (first_name, last_name, company)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get calls today
  const { count: callsTodayCount } = await supabase
    .from('call_recordings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString());

  // Get appointments booked today (created today, regardless of when they're scheduled)
  const { count: appointmentsTodayCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', user.id)
    .gte('created_at', todayStart.toISOString());

  // Get streak data
  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Prepare initial data
  const initialData = {
    user: {
      firstName: user.first_name,
      lastName: user.last_name,
    },
    mrr: {
      current: totalRevenue,
      minimum: 7000,
      target: 9000,
    },
    stats: {
      callsToday: callsTodayCount || 0,
      appointmentsToday: appointmentsTodayCount || 0,
      activeDeals: activeDeals?.length || 0,
      pipelineValue,
    },
    recentCalls: recentCalls || [],
    streak: streakData ? {
      current: streakData.current_streak || 0,
      longest: streakData.longest_streak || 0,
      totalDays: streakData.total_days_completed || 0,
      totalPoints: streakData.total_points_earned || 0,
    } : null,
  };

  return <DashboardClient initialData={initialData} />;
}
