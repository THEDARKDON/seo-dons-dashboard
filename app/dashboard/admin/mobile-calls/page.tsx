import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { MobileCallsClient } from '@/components/admin/mobile-calls-client';
import { Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, Calendar, Target } from 'lucide-react';

async function getMobileCallsData() {
  const supabase = await createClient();
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Get current user
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single();

  // Only admins can access this page
  if (user?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get all SDRs for filtering
  const { data: sdrs } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('role', 'bdr')
    .order('first_name', { ascending: true });

  // Get mobile calls with user and customer info
  const { data: calls } = await supabase
    .from('mobile_calls_with_details')
    .select('*')
    .order('called_at', { ascending: false })
    .limit(500);

  // Get tags
  const { data: tags } = await supabase
    .from('mobile_call_tags')
    .select('*')
    .order('name');

  // Calculate stats for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCalls = calls?.filter(c => new Date(c.called_at) >= today) || [];

  // Calculate stats for this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekCalls = calls?.filter(c => new Date(c.called_at) >= weekStart) || [];

  return {
    calls: calls || [],
    sdrs: sdrs || [],
    tags: tags || [],
    stats: {
      today: {
        total: todayCalls.length,
        outbound: todayCalls.filter(c => c.direction === 'outbound').length,
        inbound: todayCalls.filter(c => c.direction === 'inbound').length,
        avgDuration: todayCalls.length > 0
          ? Math.round(todayCalls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / todayCalls.length)
          : 0
      },
      week: {
        total: weekCalls.length,
        meetings: weekCalls.filter(c => c.outcome === 'meeting_booked').length,
        callbacks: weekCalls.filter(c => c.outcome === 'callback_scheduled').length,
        interested: weekCalls.filter(c => c.outcome === 'interested').length
      }
    }
  };
}

export default async function MobileCallsPage() {
  const { calls, sdrs, tags, stats } = await getMobileCallsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mobile Call Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Track and analyze mobile and external calls across the team
        </p>
      </div>

      {/* Today's Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Today&apos;s Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.today.outbound} outbound, {stats.today.inbound} inbound
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.week.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total calls made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.week.meetings}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meetings booked this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PhoneCall className="h-4 w-4" />
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(stats.today.avgDuration / 60)}m {stats.today.avgDuration % 60}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Today&apos;s average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Outcomes Overview */}
      <Card>
        <CardHeader>
          <CardTitle>This Week&apos;s Outcomes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{stats.week.meetings}</div>
              <p className="text-sm text-muted-foreground mt-1">Meetings Booked</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{stats.week.callbacks}</div>
              <p className="text-sm text-muted-foreground mt-1">Callbacks Scheduled</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{stats.week.interested}</div>
              <p className="text-sm text-muted-foreground mt-1">Interested Prospects</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call List with Filters */}
      <MobileCallsClient calls={calls} sdrs={sdrs} tags={tags} />
    </div>
  );
}