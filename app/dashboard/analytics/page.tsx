import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, DollarSign, Phone, Users, Target } from 'lucide-react';
import { ACTIVE_STAGES, CLOSED_STAGES, INACTIVE_STAGES } from '@/lib/constants/pipeline-stages';

async function getAnalytics(userId: string) {
  const supabase = await createClient();

  // Get user's Supabase ID
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return {
      deals: [],
      calls: [],
      customers: [],
      commissions: [],
    };
  }

  // Build queries based on role
  const dealsQuery = supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false });

  const callsQuery = supabase
    .from('activities')
    .select('*')
    .eq('activity_type', 'call');

  const customersQuery = supabase
    .from('customers')
    .select('*');

  const commissionsQuery = supabase
    .from('commissions')
    .select('*');

  // Apply role-based filters
  if (user.role === 'bdr') {
    dealsQuery.eq('assigned_to', user.id);
    callsQuery.eq('user_id', user.id);
    customersQuery.eq('assigned_to', user.id);
    commissionsQuery.eq('user_id', user.id);
  }

  const [
    { data: deals },
    { data: calls },
    { data: customers },
    { data: commissions },
  ] = await Promise.all([
    dealsQuery,
    callsQuery,
    customersQuery,
    commissionsQuery,
  ]);

  return {
    deals: deals || [],
    calls: calls || [],
    customers: customers || [],
    commissions: commissions || [],
  };
}

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const { deals, calls, customers, commissions } = await getAnalytics(userId);

  // Calculate metrics
  const totalDeals = deals.length;
  const wonDeals = deals.filter(d => d.stage === 'closed_won').length;
  const lostDeals = deals.filter(d => d.stage === 'closed_lost').length;
  const activeDeals = deals.filter(d => ACTIVE_STAGES.includes(d.stage)).length;

  const totalRevenue = deals
    .filter(d => d.stage === 'closed_won')
    .reduce((sum, d) => sum + Number(d.deal_value), 0);

  const pipelineValue = deals
    .filter(d => ACTIVE_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + Number(d.deal_value), 0);

  const totalCalls = calls.length;
  const today = new Date().toDateString();
  const callsToday = calls.filter(c => new Date(c.created_at).toDateString() === today).length;
  const successfulCalls = calls.filter(c => c.outcome === 'successful').length;
  const callSuccessRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

  const totalCustomers = customers.length;

  const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  const paidCommissions = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const winRate = totalDeals > 0 ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Performance metrics and insights</p>
      </div>

      {/* Revenue Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Revenue</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(pipelineValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <p className="text-sm text-muted-foreground">Commissions Earned</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalCommissions)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Paid: {formatCurrency(paidCommissions)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deals Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Deals</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{totalDeals}</p>
                <p className="text-sm text-muted-foreground">Total Deals</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{wonDeals}</p>
                <p className="text-sm text-muted-foreground">Won</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{activeDeals}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{winRate}%</p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Activity</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Calls</p>
              </div>
              <p className="text-2xl font-bold">{totalCalls}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Calls Today</p>
              </div>
              <p className="text-2xl font-bold text-primary">{callsToday}</p>
              <p className="text-xs text-muted-foreground mt-1">Target: 50</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-600" />
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{callSuccessRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
              <p className="text-2xl font-bold">{totalCustomers}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deal Stage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Pipeline Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { stage: 'prospecting', label: 'Prospecting' },
              { stage: 'qualification', label: 'Qualification' },
              { stage: 'proposal', label: 'Proposal' },
              { stage: 'negotiation', label: 'Negotiation' },
              { stage: 'closed_won', label: 'Closed Won' },
              { stage: 'closed_lost', label: 'Closed Lost' },
            ].map(({ stage, label }) => {
              const stageDeals = deals.filter(d => d.stage === stage);
              const stageValue = stageDeals.reduce((sum, d) => sum + Number(d.deal_value), 0);
              const percentage = totalDeals > 0 ? Math.round((stageDeals.length / totalDeals) * 100) : 0;

              return (
                <div key={stage} className="flex items-center gap-4">
                  <div className="w-32">
                    <p className="text-sm font-medium">{label}</p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <p className="text-sm font-medium">{stageDeals.length} deals</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(stageValue)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
