import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Mail, Phone, Globe, Linkedin, MapPin, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CustomerEditButton } from '@/components/customers/customer-edit-button';
import { CustomerDeleteButton } from '@/components/customers/customer-delete-button';
import { ClickToCallButton } from '@/components/calling/click-to-call-button';
import { DealCreateModal } from '@/components/deals/deal-create-modal';
import { GenerateProposalButton } from '@/components/proposals/generate-proposal-button';
import { ProposalsList } from '@/components/proposals/proposals-list';

async function getCustomer(customerId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (!customer) {
    notFound();
  }

  // Get deals for this customer
  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false});

  // Get activities for this customer
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('customer_id', customerId)
    .order('completed_at', { ascending: false });

  // Get proposals for this customer
  const { data: proposals } = await supabase
    .from('proposals')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  return { customer, deals: deals || [], activities: activities || [], proposals: proposals || [] };
}

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

const activityTypeIcons = {
  call: Phone,
  email: Mail,
  meeting: Briefcase,
  note: Mail,
};

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { customer, deals, activities, proposals } = await getCustomer(params.id);

  const totalDeals = deals.length;
  const activeDeals = deals.filter((d) => !['closed_won', 'closed_lost'].includes(d.stage)).length;
  const totalValue = deals.reduce((sum, d) => sum + Number(d.deal_value || 0), 0);
  const wonDeals = deals.filter((d) => d.stage === 'closed_won').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {customer.first_name} {customer.last_name}
            </h1>
            {customer.company && (
              <p className="text-muted-foreground">{customer.company}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
            {customer.status}
          </Badge>
          <CustomerEditButton customer={customer} />
          <CustomerDeleteButton customerId={customer.id} customerName={`${customer.first_name} ${customer.last_name}`} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalDeals}</div>
            <p className="text-xs text-muted-foreground">Total Deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeDeals}</div>
            <p className="text-xs text-muted-foreground">Active Deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{wonDeals}</div>
            <p className="text-xs text-muted-foreground">Won Deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${customer.email}`} className="hover:underline">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${customer.phone}`} className="hover:underline">
                    {customer.phone}
                  </a>
                </div>
                <ClickToCallButton
                  phoneNumber={customer.phone}
                  customerId={customer.id}
                  customerName={`${customer.first_name} ${customer.last_name}`}
                  customerEmail={customer.email}
                  size="sm"
                  variant="outline"
                />
              </div>
            )}
            {customer.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={customer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {customer.website}
                </a>
              </div>
            )}
            {customer.linkedin_url && (
              <div className="flex items-center gap-3">
                <Linkedin className="h-4 w-4 text-muted-foreground" />
                <a
                  href={customer.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
            {(customer.address || customer.city || customer.state || customer.postal_code || customer.country) && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  {customer.address && <div>{customer.address}</div>}
                  <div>
                    {[customer.city, customer.state, customer.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                  {customer.country && <div>{customer.country}</div>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.job_title && (
              <div>
                <p className="text-sm text-muted-foreground">Job Title</p>
                <p className="font-medium">{customer.job_title}</p>
              </div>
            )}
            {customer.company && (
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{customer.company}</p>
              </div>
            )}
            {customer.industry && (
              <div>
                <p className="text-sm text-muted-foreground">Industry</p>
                <p className="font-medium">{customer.industry}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(customer.created_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Deals ({deals.length})</CardTitle>
          <DealCreateModal
            customerId={customer.id}
            customerName={`${customer.first_name} ${customer.last_name}`}
          />
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No deals found</p>
              <DealCreateModal
                customerId={customer.id}
                customerName={`${customer.first_name} ${customer.last_name}`}
                trigger={<Button variant="outline">Create First Deal</Button>}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {deals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/dashboard/deals/${deal.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{deal.deal_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Created {formatDate(deal.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(Number(deal.deal_value))}</p>
                      {deal.probability && (
                        <p className="text-sm text-muted-foreground">{deal.probability}%</p>
                      )}
                    </div>
                    <Badge variant={stageColors[deal.stage as keyof typeof stageColors]}>
                      {stageLabels[deal.stage as keyof typeof stageLabels]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proposals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>SEO Proposals ({proposals.length})</CardTitle>
          <GenerateProposalButton
            customerId={customer.id}
            customerName={`${customer.first_name} ${customer.last_name}`}
            companyName={customer.company}
          />
        </CardHeader>
        <CardContent>
          <ProposalsList proposals={proposals} />
        </CardContent>
      </Card>

      {/* Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities ({activities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No activities found</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 10).map((activity) => {
                const Icon = activityTypeIcons[activity.activity_type as keyof typeof activityTypeIcons] || Mail;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className="rounded-full bg-muted p-2">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.subject}</p>
                      {activity.outcome && (
                        <p className="text-sm text-muted-foreground">{activity.outcome}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.completed_at && formatDate(activity.completed_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{customer.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
