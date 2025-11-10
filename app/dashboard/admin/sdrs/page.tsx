import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Phone, TrendingUp, Users, ArrowUpDown, Trophy, Target, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

async function getSDRData(userId: string) {
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

  // Get all SDRs, managers, and admins
  const { data: sdrs } = await supabase
    .from('users')
    .select('*')
    .in('role', ['bdr', 'manager', 'admin'])
    .order('created_at', { ascending: false});

  // Get all calls
  const { data: allCalls } = await supabase
    .from('call_recordings')
    .select('*');

  // Get all leads
  const { data: leads } = await supabase
    .from('leads')
    .select('id, status, assigned_to');

  // Get all customers (converted leads)
  const { data: customers } = await supabase
    .from('customers')
    .select('id, created_by');

  // Get all proposals
  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, created_by, status');

  // Get calls today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: callsToday } = await supabase
    .from('call_recordings')
    .select('*')
    .gte('created_at', today.toISOString());

  // Get calls this week
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const { data: callsThisWeek } = await supabase
    .from('call_recordings')
    .select('*')
    .gte('created_at', startOfWeek.toISOString());

  // Get calls this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { data: callsThisMonth } = await supabase
    .from('call_recordings')
    .select('*')
    .gte('created_at', startOfMonth.toISOString());

  // Calculate performance for each SDR
  const sdrPerformance = sdrs?.map(sdr => {
    const sdrCalls = allCalls?.filter(c => c.user_id === sdr.id) || [];
    const sdrLeads = leads?.filter(l => l.assigned_to === sdr.id) || [];
    const sdrCallsToday = callsToday?.filter(c => c.user_id === sdr.id) || [];
    const sdrCallsWeek = callsThisWeek?.filter(c => c.user_id === sdr.id) || [];
    const sdrCallsMonth = callsThisMonth?.filter(c => c.user_id === sdr.id) || [];
    const sdrCustomers = customers?.filter(c => c.created_by === sdr.id) || [];
    const sdrProposals = proposals?.filter(p => p.created_by === sdr.id) || [];

    const totalDuration = sdrCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0);
    const avgDuration = sdrCalls.length > 0 ? Math.floor(totalDuration / sdrCalls.length) : 0;
    const completedCalls = sdrCalls.filter(c => c.status === 'completed').length;
    const conversionRate = sdrLeads.length > 0
      ? Math.round((sdrLeads.filter(l => l.status === 'converted').length / sdrLeads.length) * 100)
      : 0;

    return {
      ...sdr,
      callsTotal: sdrCalls.length,
      callsToday: sdrCallsToday.length,
      callsWeek: sdrCallsWeek.length,
      callsMonth: sdrCallsMonth.length,
      leadsTotal: sdrLeads.length,
      leadsConverted: sdrLeads.filter(l => l.status === 'converted').length,
      customersTotal: sdrCustomers.length,
      proposalsTotal: sdrProposals.length,
      proposalsCompleted: sdrProposals.filter(p => p.status === 'completed').length,
      avgCallDuration: avgDuration,
      completionRate: sdrCalls.length > 0 ? Math.round((completedCalls / sdrCalls.length) * 100) : 0,
      conversionRate,
      totalDuration: Math.floor(totalDuration / 60), // minutes
      totalDurationHours: (totalDuration / 3600).toFixed(1), // hours
    };
  }) || [];

  return sdrPerformance;
}

export default async function SDRListPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const sdrs = await getSDRData(userId);

  if (!sdrs) {
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

  // Sort by calls today by default
  const sortedSDRs = [...sdrs].sort((a, b) => b.callsToday - a.callsToday);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SDR Performance</h1>
          <p className="text-muted-foreground">
            Detailed metrics for all sales development representatives
          </p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">← Back to Admin</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SDRs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sdrs.filter(s => s.role === 'bdr').length}</div>
            <p className="text-xs text-muted-foreground">
              {sdrs.filter(s => s.role === 'manager').length} managers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sdrs.reduce((acc, sdr) => acc + sdr.callsToday, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {sdrs.reduce((acc, sdr) => acc + sdr.callsWeek, 0)} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sdrs.reduce((acc, sdr) => acc + sdr.customersTotal, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {sdrs.reduce((acc, sdr) => acc + sdr.proposalsCompleted, 0)} proposals completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(sdrs.reduce((acc, sdr) => acc + sdr.conversionRate, 0) / sdrs.length) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Team average conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Caller Today</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedSDRs[0] && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold">{sortedSDRs[0].first_name} {sortedSDRs[0].last_name}</span>
                </div>
                <div className="text-2xl font-bold text-primary">{sortedSDRs[0].callsToday} calls</div>
                <Progress value={(sortedSDRs[0].callsToday / Math.max(...sortedSDRs.map(s => s.callsToday))) * 100} className="mt-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Best Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {[...sortedSDRs].sort((a, b) => b.conversionRate - a.conversionRate)[0] && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="font-bold">
                    {[...sortedSDRs].sort((a, b) => b.conversionRate - a.conversionRate)[0].first_name}{' '}
                    {[...sortedSDRs].sort((a, b) => b.conversionRate - a.conversionRate)[0].last_name}
                  </span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {[...sortedSDRs].sort((a, b) => b.conversionRate - a.conversionRate)[0].conversionRate}%
                </div>
                <Progress
                  value={[...sortedSDRs].sort((a, b) => b.conversionRate - a.conversionRate)[0].conversionRate}
                  className="mt-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Most Call Time</CardTitle>
          </CardHeader>
          <CardContent>
            {[...sortedSDRs].sort((a, b) => parseFloat(b.totalDurationHours) - parseFloat(a.totalDurationHours))[0] && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-bold">
                    {[...sortedSDRs].sort((a, b) => parseFloat(b.totalDurationHours) - parseFloat(a.totalDurationHours))[0].first_name}{' '}
                    {[...sortedSDRs].sort((a, b) => parseFloat(b.totalDurationHours) - parseFloat(a.totalDurationHours))[0].last_name}
                  </span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {[...sortedSDRs].sort((a, b) => parseFloat(b.totalDurationHours) - parseFloat(a.totalDurationHours))[0].totalDurationHours}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total call time</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SDR Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>SDR Leaderboard</CardTitle>
          <CardDescription>
            Click on any SDR to view detailed analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    Calls Today
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-center">Calls Week</TableHead>
                <TableHead className="text-center">Calls Month</TableHead>
                <TableHead className="text-center">Customers</TableHead>
                <TableHead className="text-center">Proposals</TableHead>
                <TableHead className="text-center">Conv. Rate</TableHead>
                <TableHead className="text-center">Call Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSDRs.map((sdr, index) => (
                <TableRow key={sdr.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {sdr.first_name} {sdr.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{sdr.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sdr.role === 'manager' ? 'default' : 'secondary'}>
                      {sdr.role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-lg font-bold text-primary">{sdr.callsToday}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{sdr.callsWeek}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{sdr.callsMonth}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{sdr.customersTotal}</span>
                      <span className="text-xs text-muted-foreground">{sdr.leadsTotal} leads</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <Badge variant={sdr.proposalsCompleted > 0 ? 'default' : 'secondary'}>
                        {sdr.proposalsCompleted}
                      </Badge>
                      <span className="text-xs text-muted-foreground">of {sdr.proposalsTotal}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <Badge
                        variant={sdr.conversionRate >= 30 ? 'default' : sdr.conversionRate >= 15 ? 'secondary' : 'outline'}
                      >
                        {sdr.conversionRate}%
                      </Badge>
                      <Progress value={sdr.conversionRate} className="mt-1 h-1 w-12" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{sdr.totalDurationHours}h</span>
                      <span className="text-xs text-muted-foreground">{sdr.callsTotal} calls</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/admin/sdrs/${sdr.id}`}>
                      <Button variant="ghost" size="sm">
                        View Details →
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
