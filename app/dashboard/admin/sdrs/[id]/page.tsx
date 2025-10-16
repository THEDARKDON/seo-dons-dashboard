import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  TrendingUp,
  Clock,
  Target,
  Mail,
  Calendar,
  Award,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';

async function getSDRDetails(adminUserId: string, sdrId: string) {
  const supabase = await createClient();

  // Check if requesting user is admin
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', adminUserId)
    .single();

  if (!adminUser || adminUser.role !== 'admin') {
    return null;
  }

  // Get SDR details
  const { data: sdr } = await supabase
    .from('users')
    .select('*')
    .eq('id', sdrId)
    .single();

  if (!sdr) {
    return null;
  }

  // Get SDR's calls
  const { data: calls } = await supabase
    .from('call_recordings')
    .select(`
      *,
      leads:lead_id(id, first_name, last_name, company),
      customers:customer_id(id, name)
    `)
    .eq('user_id', sdrId)
    .order('created_at', { ascending: false });

  // Get SDR's leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('assigned_to', sdrId)
    .order('created_at', { ascending: false});

  // Get SDR's deals
  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('assigned_to', sdrId);

  // Calculate daily call stats for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    return date;
  }).reverse();

  const dailyStats = last7Days.map(date => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayCalls = calls?.filter(c => {
      const callDate = new Date(c.created_at);
      return callDate >= date && callDate < nextDay;
    }) || [];

    return {
      date: date.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }),
      calls: dayCalls.length,
      completed: dayCalls.filter(c => c.status === 'completed').length,
    };
  });

  // Calculate stats
  const totalCalls = calls?.length || 0;
  const completedCalls = calls?.filter(c => c.status === 'completed').length || 0;
  const totalDuration = calls?.reduce((acc, c) => acc + (c.duration || 0), 0) || 0;
  const avgDuration = totalCalls > 0 ? Math.floor(totalDuration / totalCalls) : 0;
  const completionRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

  const totalLeads = leads?.length || 0;
  const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const totalDeals = deals?.length || 0;
  const totalRevenue = deals?.reduce((acc, d) => acc + (parseFloat(d.value) || 0), 0) || 0;

  // Get today's calls
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const callsToday = calls?.filter(c => new Date(c.created_at) >= today).length || 0;

  return {
    sdr,
    calls: calls || [],
    leads: leads || [],
    deals: deals || [],
    stats: {
      totalCalls,
      completedCalls,
      callsToday,
      avgDuration,
      completionRate,
      totalLeads,
      convertedLeads,
      conversionRate,
      totalDeals,
      totalRevenue,
      totalDuration: Math.floor(totalDuration / 60),
    },
    dailyStats,
  };
}

export default async function SDRDetailPage(props: { params: { id: string } }) {
  const params = props.params;
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const data = await getSDRDetails(userId, params.id);

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              SDR not found or access denied.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { sdr, calls, leads, stats, dailyStats } = data;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {sdr.first_name} {sdr.last_name}
            </h1>
            <Badge variant={sdr.role === 'manager' ? 'default' : 'secondary'}>
              {sdr.role.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {sdr.email}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {new Date(sdr.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <Link href="/dashboard/admin/sdrs">
          <Button variant="outline">← Back to SDR List</Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.callsToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCalls} total calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(stats.avgDuration / 60)}m {stats.avgDuration % 60}s
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDuration}m total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.convertedLeads} of {stats.totalLeads}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedCalls} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart - Last 7 Days */}
      <Card>
        <CardHeader>
          <CardTitle>Call Activity - Last 7 Days</CardTitle>
          <CardDescription>Daily call volume and completion rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyStats.map((day, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">{day.date}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 bg-primary rounded"
                      style={{ width: `${(day.calls / 50) * 100}%`, minWidth: day.calls > 0 ? '20px' : '0' }}
                    />
                    <span className="text-sm font-medium">{day.calls} calls</span>
                  </div>
                </div>
                <div className="w-20 text-sm text-muted-foreground text-right">
                  {day.calls > 0 ? `${Math.round((day.completed / day.calls) * 100)}%` : '0%'} success
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Calls */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>Last 10 calls made</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calls.slice(0, 10).map((call: any) => (
                <div key={call.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {call.leads?.first_name} {call.leads?.last_name} · {call.to_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(call.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                      {call.status}
                    </Badge>
                    {call.duration && (
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(call.duration / 60)}m
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {calls.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No calls yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lead Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Statistics</CardTitle>
            <CardDescription>Lead pipeline and conversion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Leads</span>
              <span className="text-2xl font-bold">{stats.totalLeads}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Converted</span>
              <span className="text-2xl font-bold text-green-600">{stats.convertedLeads}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">In Progress</span>
              <span className="text-2xl font-bold text-blue-600">
                {stats.totalLeads - stats.convertedLeads - leads.filter(l => l.status === 'lost').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Lost</span>
              <span className="text-2xl font-bold text-red-600">
                {leads.filter(l => l.status === 'lost').length}
              </span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Revenue</span>
                <span className="text-2xl font-bold">£{stats.totalRevenue.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {stats.totalDeals} deals
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
