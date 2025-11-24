import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
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

export async function RecentDeals({ userId }: { userId: string }) {
  const supabase = await createClient();

  // Get user's Supabase ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return null;
  }

  // Get recent deals
  const { data: deals } = await supabase
    .from('deals')
    .select(`
      *,
      customers (first_name, last_name, company)
    `)
    .eq('assigned_to', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!deals || deals.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Deals</CardTitle>
          <Link href="/dashboard/deals/new">
            <Button size="sm">Add Deal</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No deals yet. Create your first deal!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Deals</CardTitle>
        <Link href="/dashboard/deals">
          <Button variant="ghost" size="sm" className="gap-2">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deals.map((deal) => {
            const customer = deal.customers as any;

            return (
              <Link
                key={deal.id}
                href={`/dashboard/deals/${deal.id}`}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium">{deal.deal_name}</p>
                  {customer && (
                    <p className="text-sm text-muted-foreground">
                      {customer.company || `${customer.first_name} ${customer.last_name}`}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant={stageColors[deal.stage as keyof typeof stageColors]}>
                      {stageLabels[deal.stage as keyof typeof stageLabels]}
                    </Badge>
                    {deal.expected_close_date && (
                      <span className="text-xs text-muted-foreground">
                        Expected: {formatDate(deal.expected_close_date)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(Number(deal.deal_value))}</p>
                  {deal.probability && (
                    <p className="text-sm text-muted-foreground">{deal.probability}% likely</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
