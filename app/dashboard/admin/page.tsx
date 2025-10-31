import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Phone,
  TrendingUp,
  Clock,
  Target,
  Activity,
  Award,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getAdminStats(userId: string) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single();

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Get all SDRs
  const { data: sdrs } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, role, created_at')
    .in('role', ['bdr', 'manager'])
    .order('created_at', { ascending: false });

  // Get all calls
  const { data: allCalls } = await supabase
    .from('call_recordings')
    .select(`
      *,
      users:user_id(id, first_name, last_name, role)
    `)
    .order('created_at', { ascending: false });

  // Get calls today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: callsToday } = await supabase
    .from('call_recordings')
    .select('*')
    .gte('created_at', today.toISOString());

  // Get all leads
  const { data: leads } = await supabase
    .from('leads')
    .select('id, status, assigned_to, created_at');

  // Get all deals
  const { data: deals } = await supabase
    .from('deals')
    .select('id, value, stage, created_at');

  // Calculate SDR performance
  const sdrPerformance = sdrs?.map(sdr => {
    const sdrCalls = allCalls?.filter(c => c.user_id === sdr.id) || [];
    const sdrLeads = leads?.filter(l => l.assigned_to === sdr.id) || [];
    const sdrCallsToday = callsToday?.filter(c => c.user_id === sdr.id) || [];

    const totalDuration = sdrCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0);
    const avgDuration = sdrCalls.length > 0 ? Math.floor(totalDuration / sdrCalls.length) : 0;
    const completedCalls = sdrCalls.filter(c => c.status === 'completed').length;

    return {
      ...sdr,
      callsTotal: sdrCalls.length,
      callsToday: sdrCallsToday.length,
      leadsTotal: sdrLeads.length,
      leadsConverted: sdrLeads.filter(l => l.status === 'converted').length,
      avgCallDuration: avgDuration,
      completionRate: sdrCalls.length > 0 ? Math.round((completedCalls / sdrCalls.length) * 100) : 0,
    };
  }).sort((a, b) => b.callsToday - a.callsToday) || [];

  // Calculate overall stats
  const totalCalls = allCalls?.length || 0;
  const totalCallsToday = callsToday?.length || 0;
  const totalDuration = allCalls?.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) || 0;
  const avgCallDuration = totalCalls > 0 ? Math.floor(totalDuration / totalCalls) : 0;
  const completedCalls = allCalls?.filter(c => c.status === 'completed').length || 0;
  const completionRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

  const totalLeads = leads?.length || 0;
  const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const totalRevenue = deals?.reduce((acc, d) => acc + (parseFloat(d.value) || 0), 0) || 0;

  return {
    sdrs: sdrPerformance,
    stats: {
      totalSDRs: sdrs?.length || 0,
      activeSdrs: sdrs?.filter(s => s.role === 'bdr').length || 0,
      totalCalls,
      totalCallsToday,
      avgCallDuration,
      completionRate,
      totalLeads,
      convertedLeads,
      conversionRate,
      totalRevenue,
      totalDuration: Math.floor(totalDuration / 60), // in minutes
    }
  };
}

export default async function AdminDashboard() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const data = await getAdminStats(userId);

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Access denied. This page is only available to administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { sdrs, stats } = data;
  const topPerformers = sdrs.slice(0, 5);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of all SDR performance and analytics</p>
        </div>
        <Link href="/dashboard/admin/sdrs">
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            View All SDRs →
          </Badge>
        </Link>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SDRs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSdrs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSDRs} total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCallsToday}</div>
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
              {Math.floor(stats.avgCallDuration / 60)}m {stats.avgCallDuration % 60}s
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDuration}m total duration
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
              {stats.convertedLeads} of {stats.totalLeads} leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Call Completion Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Successful connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From all deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads - stats.convertedLeads}</div>
            <p className="text-xs text-muted-foreground">
              In pipeline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            <CardTitle>Top Performers Today</CardTitle>
          </div>
          <CardDescription>SDRs ranked by calls made today</CardDescription>
        </CardHeader>
        <CardContent>
          {topPerformers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No SDR activity yet today
            </div>
          ) : (
            <div className="space-y-4">
              {topPerformers.map((sdr, index) => (
                <Link
                  key={sdr.id}
                  href={`/dashboard/admin/sdrs/${sdr.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {sdr.first_name} {sdr.last_name}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {sdr.role.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{sdr.email}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-6 text-center">
                      <div>
                        <p className="text-2xl font-bold">{sdr.callsToday}</p>
                        <p className="text-xs text-muted-foreground">Today</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{sdr.callsTotal}</p>
                        <p className="text-xs text-muted-foreground">Total Calls</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{sdr.leadsTotal}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{sdr.completionRate}%</p>
                        <p className="text-xs text-muted-foreground">Success</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/dashboard/admin/sdrs">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-base">View All SDRs</CardTitle>
              <CardDescription>Detailed SDR list and analytics</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/calls">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-base">Call Analytics</CardTitle>
              <CardDescription>All call recordings and stats</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/admin/call-review">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-base">Call Review Dashboard</CardTitle>
              <CardDescription>Review and rate SDR call quality</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/admin/users">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-base">User Management</CardTitle>
              <CardDescription>Manage users and permissions</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
