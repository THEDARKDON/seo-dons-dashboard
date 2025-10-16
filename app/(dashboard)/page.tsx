import { MetricCard } from '@/components/dashboard/metric-card';
import { DollarSign, Phone, Calendar, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const { userId } = await auth();
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('users')
    .select('first_name, last_name, email, role')
    .eq('clerk_id', userId)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.first_name || 'User'}!</h1>
        <p className="text-gray-600 mt-1">Here's your dashboard.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value="$0"
          icon={DollarSign}
          description="This month"
        />
        <MetricCard
          title="Calls Today"
          value={0}
          icon={Phone}
          description="Target: 50"
        />
        <MetricCard
          title="Meetings This Week"
          value={0}
          icon={Calendar}
          description="Scheduled"
        />
        <MetricCard
          title="Active Deals"
          value={0}
          icon={Briefcase}
          description="In pipeline"
        />
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
            <a href="/dashboard/deals/new" className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition">
              <div className="font-semibold text-green-900">Create Deal</div>
              <div className="text-sm text-green-700">Add a new opportunity</div>
            </a>
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
