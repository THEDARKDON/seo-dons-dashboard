'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/dashboard/metric-card';
import { MRRGoalWidget } from '@/components/dashboard/mrr-goal-widget';
import { DailyTaskCard } from '@/components/dashboard/daily-task-card';
import { TaskStreak } from '@/components/dashboard/task-streak';
import { CallHistoryMini } from '@/components/dashboard/call-history-mini';
import { ActivityLeaderboard } from '@/components/dashboard/activity-leaderboard';
import { Phone, Calendar, Briefcase, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardClientProps {
  initialData: {
    user: {
      firstName: string;
      lastName: string;
    };
    mrr: {
      current: number;
      minimum: number;
      target: number;
    };
    stats: {
      callsToday: number;
      appointmentsToday: number;
      activeDeals: number;
      pipelineValue: number;
    };
    recentCalls: any[];
    streak: {
      current: number;
      longest: number;
      totalDays: number;
      totalPoints: number;
    } | null;
  };
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch daily tasks
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/daily-tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskType: string, completed: boolean) => {
    try {
      const response = await fetch('/api/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_type: taskType, completed }),
      });

      if (response.ok) {
        // Refresh tasks
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {initialData.user.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {dayOfWeek}, {formattedDate}
            {initialData.streak && initialData.streak.current > 0 && (
              <span className="ml-2 text-orange-600 font-semibold">
                🔥 {initialData.streak.current} day streak
              </span>
            )}
          </p>
        </div>
      </div>

      {/* MRR Goal - Full Width Hero */}
      <MRRGoalWidget
        current={initialData.mrr.current}
        minimum={initialData.mrr.minimum}
        target={initialData.mrr.target}
      />

      {/* Streak Card + Daily Tasks + Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-3">
        {initialData.streak && (
          <TaskStreak
            currentStreak={initialData.streak.current}
            longestStreak={initialData.streak.longest}
            totalDays={initialData.streak.totalDays}
            totalPoints={initialData.streak.totalPoints}
          />
        )}
        {!loading && tasks.length > 0 && (
          <DailyTaskCard tasks={tasks} onTaskToggle={handleTaskToggle} />
        )}
        <ActivityLeaderboard />
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Calls Today"
          value={initialData.stats.callsToday}
          icon={Phone}
          description="Target: 50"
          trend={
            initialData.stats.callsToday >= 50
              ? { value: 100, isPositive: true }
              : undefined
          }
        />
        <MetricCard
          title="Appointments Today"
          value={initialData.stats.appointmentsToday}
          icon={Calendar}
          description="Target: 3"
          trend={
            initialData.stats.appointmentsToday >= 3
              ? { value: 100, isPositive: true }
              : undefined
          }
        />
        <MetricCard
          title="Active Deals"
          value={initialData.stats.activeDeals}
          icon={Briefcase}
          description="In pipeline"
        />
        <MetricCard
          title="Pipeline Value"
          value={formatCurrency(initialData.stats.pipelineValue)}
          icon={TrendingUp}
          description="Total opportunity"
        />
      </div>

      {/* Recent Activity & Deal Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Calls */}
        <CallHistoryMini calls={initialData.recentCalls} />

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>This Month Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Revenue Closed</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(initialData.mrr.current)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {((initialData.mrr.current / initialData.mrr.target) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">of target</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Active Pipeline</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(initialData.stats.pipelineValue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {initialData.stats.activeDeals} deals
                </p>
                <p className="text-xs text-gray-500">in progress</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Activity Today</p>
                <p className="text-2xl font-bold text-purple-700">
                  {initialData.stats.callsToday + initialData.stats.appointmentsToday}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {initialData.stats.callsToday} calls
                </p>
                <p className="text-xs text-gray-500">
                  {initialData.stats.appointmentsToday} appointments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
