import { MetricCard } from '@/components/dashboard/metric-card';
import { DollarSign, Phone, Calendar, Briefcase, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { AchievementService } from '@/lib/services/achievement-service';
import { getOrCreateUser } from '@/lib/supabase/helpers';
import Link from 'next/link';

export default async function DashboardPage() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  const supabase = await createClient();

  const user = await getOrCreateUser(userId!, clerkUser);

  // Get current month's start date
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());

  // Get total revenue from closed deals this month
  const { data: deals } = await supabase
    .from('deals')
    .select('deal_value')
    .eq('assigned_to', user?.id)
    .eq('stage', 'closed_won')
    .gte('actual_close_date', monthStart.toISOString());

  const totalRevenue = deals?.reduce((sum, deal) => sum + Number(deal.deal_value), 0) || 0;

  // Get calls today
  const { data: callsToday } = await supabase
    .from('activities')
    .select('id')
    .eq('user_id', user?.id)
    .eq('activity_type', 'call')
    .gte('completed_at', todayStart.toISOString());

  // Get meetings this week
  const { data: meetingsWeek } = await supabase
    .from('appointments')
    .select('id')
    .eq('user_id', user?.id)
    .gte('scheduled_start', weekStart.toISOString())
    .eq('status', 'scheduled');

  // Get active deals
  const { data: activeDeals } = await supabase
    .from('deals')
    .select('id')
    .eq('assigned_to', user?.id)
    .in('stage', ['prospecting', 'qualification', 'proposal', 'negotiation']);

  // Get achievement points
  const totalPoints = user?.id ? await AchievementService.getUserPoints(user.id) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.first_name || 'User'}!</h1>
        <p className="text-gray-600 mt-1">Here&apos;s your dashboard.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          description="This month"
        />
        <MetricCard
          title="Calls Today"
          value={callsToday?.length || 0}
          icon={Phone}
          description="Target: 50"
        />
        <MetricCard
          title="Meetings This Week"
          value={meetingsWeek?.length || 0}
          icon={Calendar}
          description="Scheduled"
        />
        <MetricCard
          title="Active Deals"
          value={activeDeals?.length || 0}
          icon={Briefcase}
          description="In pipeline"
        />
        <a href="/dashboard/achievements">
          <MetricCard
            title="Achievement Points"
            value={totalPoints}
            icon={Trophy}
            description="View achievements"
          />
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/dashboard/calls/new" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
              <div className="font-semibold text-blue-900">Log a Call</div>
              <div className="text-sm text-blue-700">Record your latest conversation</div>
            </a>
            <Link href="/dashboard/deals/new" className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition">
              <div className="font-semibold text-green-900">Create Deal</div>
              <div className="text-sm text-green-700">Add a new opportunity</div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Role:</strong> {user?.role?.toUpperCase()}</p>
            <p><strong>Email:</strong> {user?.email}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
