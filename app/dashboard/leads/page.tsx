import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { LeadsList } from '@/components/leads/leads-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Kanban } from 'lucide-react';
import Link from 'next/link';

async function getLeadsData(userId: string) {
  try {
    const supabase = await createClient();

    // Get user's Supabase ID and role
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return { leads: [], stats: { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0 } };
    }

    // Get leads - BDRs/SDRs see only their own, managers/admins see all
    let query = supabase
      .from('leads')
      .select(`
        *,
        users!leads_assigned_to_fkey (id, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    // Admins and managers see all leads, everyone else sees only their assigned leads
    if (user.role !== 'admin' && user.role !== 'manager') {
      query = query.eq('assigned_to', user.id);
    }

    const { data: leads } = await query;

    // Calculate stats
    const stats = {
      total: leads?.length || 0,
      new: leads?.filter(l => l.status === 'new').length || 0,
      contacted: leads?.filter(l => l.status === 'contacted').length || 0,
      qualified: leads?.filter(l => l.status === 'qualified').length || 0,
      converted: leads?.filter(l => l.status === 'converted').length || 0,
    };

    return { leads: leads || [], stats };
  } catch (error) {
    console.error('Error fetching leads:', error);
    return { leads: [], stats: { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0 } };
  }
}

export default async function LeadsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const { leads, stats } = await getLeadsData(userId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage and qualify your prospects</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/leads/pipeline">
            <Button variant="outline" className="gap-2">
              <Kanban className="h-4 w-4" />
              Pipeline View
            </Button>
          </Link>
          <Link href="/dashboard/leads/import">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
          </Link>
          <Link href="/dashboard/leads/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.qualified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      <Suspense fallback={<div>Loading leads...</div>}>
        <LeadsList initialLeads={leads} />
      </Suspense>
    </div>
  );
}
