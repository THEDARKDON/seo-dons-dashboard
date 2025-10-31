import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

interface DashboardStats {
  mrr: {
    current: number;
    minimumGoal: number;
    targetGoal: number;
    percentToMin: number;
    percentToTarget: number;
    isAboveMinimum: boolean;
    isTargetMet: boolean;
  };
  calls: {
    today: number;
    weekly: number;
    monthly: number;
    dailyTarget: number;
    weeklyTarget: number;
    monthlyTarget: number;
    successRate: number;
  };
  appointments: {
    today: number;
    weekly: number;
    monthly: number;
    dailyTarget: number;
    weeklyTarget: number;
    monthlyTarget: number;
  };
  deals: {
    active: number;
    pipelineValue: number;
    wonThisMonth: number;
    lostThisMonth: number;
    winRate: number;
    byStage: {
      prospecting: number;
      qualification: number;
      proposal: number;
      negotiation: number;
    };
  };
  streak: {
    current: number;
    longest: number;
    totalDays: number;
    totalPoints: number;
  } | null;
}

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

    // Date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    // ========================================
    // MRR Calculation
    // ========================================
    const { data: closedDeals } = await supabase
      .from('deals')
      .select('deal_value')
      .eq('assigned_to', user.id)
      .eq('stage', 'closed_won')
      .gte('actual_close_date', monthStart.toISOString());

    const currentMRR = closedDeals?.reduce((sum, deal) => sum + Number(deal.deal_value), 0) || 0;
    const minimumGoal = 7000;
    const targetGoal = 9000;

    const mrrStats = {
      current: currentMRR,
      minimumGoal,
      targetGoal,
      percentToMin: Math.min((currentMRR / minimumGoal) * 100, 100),
      percentToTarget: Math.min((currentMRR / targetGoal) * 100, 100),
      isAboveMinimum: currentMRR >= minimumGoal,
      isTargetMet: currentMRR >= targetGoal,
    };

    // ========================================
    // Calls Statistics
    // ========================================
    const { count: callsTodayCount } = await supabase
      .from('call_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString());

    const { count: callsWeekCount } = await supabase
      .from('call_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', weekStart.toISOString());

    const { count: callsMonthCount } = await supabase
      .from('call_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString());

    // Calculate success rate
    const { count: successfulCallsCount } = await supabase
      .from('call_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', monthStart.toISOString());

    const successRate = callsMonthCount && callsMonthCount > 0
      ? Math.round(((successfulCallsCount || 0) / callsMonthCount) * 100)
      : 0;

    const callsStats = {
      today: callsTodayCount || 0,
      weekly: callsWeekCount || 0,
      monthly: callsMonthCount || 0,
      dailyTarget: 50,
      weeklyTarget: 250,
      monthlyTarget: 1000,
      successRate,
    };

    // ========================================
    // Appointments Statistics
    // ========================================
    const { count: appointmentsTodayCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString());

    const { count: appointmentsWeekCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', weekStart.toISOString());

    const { count: appointmentsMonthCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString());

    const appointmentsStats = {
      today: appointmentsTodayCount || 0,
      weekly: appointmentsWeekCount || 0,
      monthly: appointmentsMonthCount || 0,
      dailyTarget: 3,
      weeklyTarget: 15,
      monthlyTarget: 60,
    };

    // ========================================
    // Deals Statistics
    // ========================================
    const { data: allDeals } = await supabase
      .from('deals')
      .select('stage, deal_value')
      .eq('assigned_to', user.id);

    const activeDeals = allDeals?.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)) || [];
    const wonDeals = allDeals?.filter(d => d.stage === 'closed_won') || [];
    const lostDeals = allDeals?.filter(d => d.stage === 'closed_lost') || [];

    const pipelineValue = activeDeals.reduce((sum, deal) => sum + Number(deal.deal_value), 0);
    const winRate = (wonDeals.length + lostDeals.length) > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0;

    const dealsStats = {
      active: activeDeals.length,
      pipelineValue,
      wonThisMonth: wonDeals.length,
      lostThisMonth: lostDeals.length,
      winRate,
      byStage: {
        prospecting: allDeals?.filter(d => d.stage === 'prospecting').length || 0,
        qualification: allDeals?.filter(d => d.stage === 'qualification').length || 0,
        proposal: allDeals?.filter(d => d.stage === 'proposal').length || 0,
        negotiation: allDeals?.filter(d => d.stage === 'negotiation').length || 0,
      },
    };

    // ========================================
    // Streak Statistics
    // ========================================
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const streakStats = streakData ? {
      current: streakData.current_streak || 0,
      longest: streakData.longest_streak || 0,
      totalDays: streakData.total_days_completed || 0,
      totalPoints: streakData.total_points_earned || 0,
    } : null;

    // ========================================
    // Compile Response
    // ========================================
    const stats: DashboardStats = {
      mrr: mrrStats,
      calls: callsStats,
      appointments: appointmentsStats,
      deals: dealsStats,
      streak: streakStats,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
