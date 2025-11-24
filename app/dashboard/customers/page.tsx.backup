import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { formatDate } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ACTIVE_STAGES } from '@/lib/constants/pipeline-stages';

async function getCustomers(userId: string) {
  const supabase = await createClient();

  // Get user's Supabase ID and role
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return [];
  }

  // Build query - BDRs see only their customers, managers/admins see all
  let query = supabase
    .from('customers')
    .select(`
      *,
      deals (id, deal_name, deal_value, stage)
    `)
    .order('created_at', { ascending: false });

  // Filter for BDRs only - managers and admins see everything
  if (user.role === 'bdr') {
    query = query.eq('owned_by', user.id);
  }

  const { data: customers } = await query;

  return customers || [];
}

export default async function CustomersPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const customers = await getCustomers(userId);

  // Calculate stats for each customer
  const customersWithStats = customers.map((customer) => {
    const deals = customer.deals as any[];
    const totalDeals = deals?.length || 0;
    const activeDeals = deals?.filter((d) => ACTIVE_STAGES.includes(d.stage)).length || 0;
    const totalValue = deals?.reduce((sum, d) => sum + Number(d.deal_value || 0), 0) || 0;

    return {
      ...customer,
      totalDeals,
      activeDeals,
      totalValue,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers ({customersWithStats.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Phone</th>
                  <th className="pb-3 font-medium">Deals</th>
                  <th className="pb-3 font-medium">Total Value</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {customersWithStats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No customers found. Create your first customer to get started.
                    </td>
                  </tr>
                ) : (
                  customersWithStats.map((customer) => (
                    <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-4">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="font-medium hover:underline"
                        >
                          {customer.first_name} {customer.last_name}
                        </Link>
                      </td>
                      <td className="py-4">{customer.company || '-'}</td>
                      <td className="py-4">{customer.email || '-'}</td>
                      <td className="py-4">{customer.phone || '-'}</td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">
                            {customer.totalDeals} total
                          </span>
                          {customer.activeDeals > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {customer.activeDeals} active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        ${customer.totalValue.toLocaleString()}
                      </td>
                      <td className="py-4">
                        <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                          {customer.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {formatDate(customer.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
