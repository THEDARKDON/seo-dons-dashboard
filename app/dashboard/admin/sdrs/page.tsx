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
import { Phone, TrendingUp, Users, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

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

  // Get all SDRs and managers
  const { data: sdrs } = await supabase
    .from('users')
    .select('*')
    .in('role', ['bdr', 'manager'])
    .order('created_at', { ascending: false});

  // Get all calls
  const { data: allCalls } = await supabase
    .from('call_recordings')
    .select('*');

  // Get all leads
  const { data: leads } = await supabase
    .from('leads')
    .select('id, status, assigned_to');

  // Get calls today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: callsToday } = await supabase
    .from('call_recordings')
    .select('*')
    .gte('created_at', today.toISOString());

  // Calculate performance for each SDR
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
      totalDuration: Math.floor(totalDuration / 60), // minutes
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
      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Total Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sdrs.reduce((acc, sdr) => acc + sdr.callsToday, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {Math.floor(sdrs.reduce((acc, sdr) => acc + sdr.callsToday, 0) / sdrs.length)} per SDR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sdrs.reduce((acc, sdr) => acc + sdr.leadsTotal, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {sdrs.reduce((acc, sdr) => acc + sdr.leadsConverted, 0)} converted
            </p>
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
                <TableHead className="text-center">Total Calls</TableHead>
                <TableHead className="text-center">Leads</TableHead>
                <TableHead className="text-center">Converted</TableHead>
                <TableHead className="text-center">Avg Duration</TableHead>
                <TableHead className="text-center">Success Rate</TableHead>
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
                    <span className="text-lg font-bold">{sdr.callsToday}</span>
                  </TableCell>
                  <TableCell className="text-center">{sdr.callsTotal}</TableCell>
                  <TableCell className="text-center">{sdr.leadsTotal}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={sdr.leadsConverted > 0 ? 'default' : 'secondary'}>
                      {sdr.leadsConverted}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {sdr.avgCallDuration > 0
                      ? `${Math.floor(sdr.avgCallDuration / 60)}m ${sdr.avgCallDuration % 60}s`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={sdr.completionRate >= 70 ? 'default' : 'secondary'}
                    >
                      {sdr.completionRate}%
                    </Badge>
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
