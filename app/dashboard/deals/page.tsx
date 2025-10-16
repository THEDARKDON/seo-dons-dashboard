import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const stageColors = {
  prospecting: 'secondary',
  qualification: 'default',
  proposal: 'default',
  negotiation: 'default',
  closed_won: 'success',
  closed_lost: 'destructive',
} as const;

const stageLabels = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Won',
  closed_lost: 'Lost',
};

async function getDeals(userId: string) {
  const supabase = await createClient();

  // Get user's Supabase ID
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return [];
  }

  // Get deals (managers/admins see all, BDRs see only their own)
  const query = supabase
    .from('deals')
    .select(`
      *,
      customers (first_name, last_name, company),
      users!deals_assigned_to_fkey (first_name, last_name)
    `)
    .order('created_at', { ascending: false });

  // Apply filter based on role
  if (user.role === 'bdr') {
    query.eq('assigned_to', user.id);
  }

  const { data: deals } = await query;

  return deals || [];
}

export default async function DealsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const deals = await getDeals(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deals</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <Link href="/dashboard/deals/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Deals</CardTitle>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No deals yet</p>
              <Link href="/dashboard/deals/new">
                <Button>Create Your First Deal</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {deals.map((deal) => {
                const customer = deal.customers as any;
                const assignedUser = deal.users as any;

                return (
                  <Link
                    key={deal.id}
                    href={`/dashboard/deals/${deal.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{deal.deal_name}</p>
                        <Badge variant={stageColors[deal.stage as keyof typeof stageColors]}>
                          {stageLabels[deal.stage as keyof typeof stageLabels]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {customer && (
                          <span>
                            {customer.company || `${customer.first_name} ${customer.last_name}`}
                          </span>
                        )}
                        {assignedUser && (
                          <span>
                            Assigned to: {assignedUser.first_name} {assignedUser.last_name}
                          </span>
                        )}
                        {deal.expected_close_date && (
                          <span>Expected: {formatDate(deal.expected_close_date)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(Number(deal.deal_value))}</p>
                      {deal.probability && (
                        <p className="text-sm text-muted-foreground">{deal.probability}%</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
