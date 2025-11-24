import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, TrendingUp, Clock } from 'lucide-react';

async function getCommissions(userId: string) {
  const supabase = await createClient();

  // Get user's Supabase ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return { commissions: [], stats: { pending: 0, approved: 0, paid: 0, total: 0 } };
  }

  // Get all commissions
  const { data: commissions } = await supabase
    .from('commissions')
    .select(`
      *,
      deals (deal_name, deal_value, stage)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!commissions) {
    return { commissions: [], stats: { pending: 0, approved: 0, paid: 0, total: 0 } };
  }

  // Calculate stats
  const stats = {
    pending: commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + Number(c.amount), 0),
    approved: commissions
      .filter(c => c.status === 'approved')
      .reduce((sum, c) => sum + Number(c.amount), 0),
    paid: commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.amount), 0),
    total: commissions.reduce((sum, c) => sum + Number(c.amount), 0),
  };

  return { commissions, stats };
}

export default async function CommissionsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const { commissions, stats } = await getCommissions(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commissions</h1>
        <p className="text-muted-foreground">Track your earnings and payouts</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Earned</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.approved)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">Paid</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission List */}
      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No commissions yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Close your first deal to start earning!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {commissions.map((commission) => {
                const deal = commission.deals as any;

                return (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">
                          {commission.commission_type === 'first_month' ? 'First Month Commission' : 'Ongoing Commission'}
                        </p>
                        <Badge
                          variant={
                            commission.status === 'paid' ? 'success' :
                            commission.status === 'approved' ? 'default' :
                            'secondary'
                          }
                        >
                          {commission.status}
                        </Badge>
                      </div>
                      {deal && (
                        <p className="text-sm text-muted-foreground">
                          Deal: {deal.deal_name} · {formatCurrency(Number(deal.deal_value))}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {commission.period_start && (
                          <span>
                            Period: {formatDate(commission.period_start)} - {commission.period_end && formatDate(commission.period_end)}
                          </span>
                        )}
                        <span>Rate: {(Number(commission.rate) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(Number(commission.amount))}</p>
                      {commission.payment_date && (
                        <p className="text-sm text-muted-foreground">
                          Paid: {formatDate(commission.payment_date)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Commission Structure</h3>
          <ul className="space-y-2 text-sm text-blue-900">
            <li>• <strong>First Month:</strong> 50% of deal value</li>
            <li>• <strong>Ongoing:</strong> 10% per month (recurring)</li>
            <li>• Commissions are automatically created when deals are marked as &quot;Closed Won&quot;</li>
            <li>• Payouts are processed monthly after approval</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
