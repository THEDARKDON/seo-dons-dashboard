import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CommissionCalculator } from '@/lib/services/commission-calculator';
import { notFound } from 'next/navigation';
import { DealEditButton } from '@/components/deals/deal-edit-button';
import { DealDeleteButton } from '@/components/deals/deal-delete-button';
import { DealStagePipeline } from '@/components/deals/deal-stage-pipeline';
import { DealActivities } from '@/components/deals/deal-activities';
import { ClickToCallButton } from '@/components/calling/click-to-call-button';

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

async function getDeal(dealId: string) {
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from('deals')
    .select(`
      *,
      customers (first_name, last_name, company, email, phone),
      users!deals_assigned_to_fkey (first_name, last_name, email)
    `)
    .eq('id', dealId)
    .single();

  if (!deal) {
    notFound();
  }

  // Get commissions for this deal
  const { data: commissions } = await supabase
    .from('commissions')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  // Get activities for this deal
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('deal_id', dealId)
    .order('completed_at', { ascending: false });

  return { deal, commissions: commissions || [], activities: activities || [] };
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { deal, commissions, activities } = await getDeal(id);
  const customer = deal.customers as any;
  const assignedUser = deal.users as any;

  // Calculate commission projection
  const projection = CommissionCalculator.projectCommission(Number(deal.deal_value), 12);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/deals">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{deal.deal_name}</h1>
            <p className="text-muted-foreground">
              Created {formatDate(deal.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={stageColors[deal.stage as keyof typeof stageColors]} className="text-sm px-3 py-1">
            {stageLabels[deal.stage as keyof typeof stageLabels]}
          </Badge>
          <DealEditButton deal={deal} />
          <DealDeleteButton dealId={deal.id} dealName={deal.deal_name} />
        </div>
      </div>

      {/* Stage Pipeline */}
      <DealStagePipeline dealId={deal.id} currentStage={deal.stage} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Deal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Deal Value</p>
              <p className="text-2xl font-bold">{formatCurrency(Number(deal.deal_value))}</p>
            </div>
            {deal.probability && (
              <div>
                <p className="text-sm text-muted-foreground">Probability</p>
                <p className="text-lg font-medium">{deal.probability}%</p>
              </div>
            )}
            {deal.expected_close_date && (
              <div>
                <p className="text-sm text-muted-foreground">Expected Close Date</p>
                <p className="text-lg font-medium">{formatDate(deal.expected_close_date)}</p>
              </div>
            )}
            {deal.actual_close_date && (
              <div>
                <p className="text-sm text-muted-foreground">Actual Close Date</p>
                <p className="text-lg font-medium">{formatDate(deal.actual_close_date)}</p>
              </div>
            )}
            {deal.source && (
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="text-lg font-medium">{deal.source}</p>
              </div>
            )}
            {assignedUser && (
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="text-lg font-medium">
                  {assignedUser.first_name} {assignedUser.last_name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="text-lg font-medium">
                    {customer.first_name} {customer.last_name}
                  </p>
                </div>
                {customer.company && (
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="text-lg font-medium">{customer.company}</p>
                  </div>
                )}
                {customer.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-lg font-medium">{customer.email}</p>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-medium">{customer.phone}</p>
                      <ClickToCallButton
                        phoneNumber={customer.phone}
                        customerId={deal.customer_id}
                        dealId={deal.id}
                        customerName={`${customer.first_name} ${customer.last_name}`}
                        size="sm"
                        variant="outline"
                        showLabel={false}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No customer assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commission Projection */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">First Month (50%)</p>
              <p className="text-2xl font-bold">{formatCurrency(projection.firstMonth)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Monthly Ongoing (10%)</p>
              <p className="text-2xl font-bold">{formatCurrency(projection.monthly)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">12-Month Total</p>
              <p className="text-2xl font-bold">{formatCurrency(projection.total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actual Commissions */}
      {commissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {commissions.map((commission) => (
                <div key={commission.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">
                      {commission.commission_type === 'first_month' ? 'First Month' : 'Ongoing'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {commission.period_start && formatDate(commission.period_start)} - {commission.period_end && formatDate(commission.period_end)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(Number(commission.amount))}</p>
                    <Badge variant={commission.status === 'paid' ? 'success' : 'secondary'}>
                      {commission.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {deal.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{deal.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Activities */}
      <DealActivities dealId={deal.id} activities={activities} />
    </div>
  );
}
