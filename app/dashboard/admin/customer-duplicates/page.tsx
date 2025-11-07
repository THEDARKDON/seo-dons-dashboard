/**
 * Customer Duplicates Diagnostic Page
 *
 * Helps find and resolve duplicate customer records
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

async function findDuplicateCustomers() {
  const supabase = await createClient();

  // Find all customers with their owners
  const { data: customers } = await supabase
    .from('customers')
    .select(`
      *,
      owner:owned_by(id, full_name, email),
      proposals(id, proposal_number, status)
    `)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  // Group customers by similar names
  const groupedCustomers: { [key: string]: any[] } = {};

  customers?.forEach((customer) => {
    // Create a key based on name (lowercase, trimmed)
    const fullName = `${(customer.first_name || '').trim().toLowerCase()} ${(customer.last_name || '').trim().toLowerCase()}`;

    if (!groupedCustomers[fullName]) {
      groupedCustomers[fullName] = [];
    }
    groupedCustomers[fullName].push(customer);
  });

  // Filter to only show duplicates
  const duplicates = Object.entries(groupedCustomers)
    .filter(([_, customers]) => customers.length > 1)
    .map(([name, customers]) => ({ name, customers }));

  return { customers, duplicates };
}

export default async function CustomerDuplicatesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Check if user is admin/manager
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('clerk_id', userId)
    .single();

  if (!user || !['admin', 'manager'].includes(user.role)) {
    redirect('/dashboard');
  }

  const { customers, duplicates } = await findDuplicateCustomers();

  // Find Matthew Wilcken specifically
  const matthewWilckens = customers?.filter(
    (c) =>
      c.first_name?.toLowerCase() === 'matthew' &&
      c.last_name?.toLowerCase() === 'wilcken'
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Duplicates Diagnostic</h1>
        <p className="text-muted-foreground">
          Find and resolve duplicate customer records across your organization
        </p>
      </div>

      {/* Matthew Wilcken Alert */}
      {matthewWilckens.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <CardTitle>Matthew Wilcken Records Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matthewWilckens.map((customer) => (
                <div
                  key={customer.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {customer.first_name} {customer.last_name}
                    </Link>
                    <Badge variant="outline">{customer.id.slice(0, 8)}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Company: </span>
                      {customer.company || 'N/A'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email: </span>
                      {customer.email || 'N/A'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Owner: </span>
                      {customer.owner ? (
                        <span className="font-medium">
                          {customer.owner.full_name || customer.owner.email}
                        </span>
                      ) : (
                        <span className="text-red-500">Unassigned</span>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created: </span>
                      {formatDate(customer.created_at)}
                    </div>
                  </div>
                  {customer.proposals && customer.proposals.length > 0 && (
                    <div className="pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        Proposals:{' '}
                      </span>
                      {customer.proposals.map((p: any) => (
                        <Badge key={p.id} variant="secondary" className="ml-1">
                          {p.proposal_number} ({p.status})
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Duplicates */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Duplicate Customers ({duplicates.length} sets found)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {duplicates.length === 0 ? (
            <p className="text-muted-foreground">
              No duplicate customers found. Good job keeping your data clean!
            </p>
          ) : (
            <div className="space-y-6">
              {duplicates.map(({ name, customers }) => (
                <div key={name} className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-medium">
                    &quot;{name}&quot; ({customers.length} records)
                  </h3>
                  <div className="grid gap-2">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between text-sm border-l-2 pl-3"
                      >
                        <div className="flex items-center gap-4">
                          <Link
                            href={`/dashboard/customers/${customer.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </Link>
                          <span>
                            {customer.company || 'No company'} |{' '}
                            {customer.email || 'No email'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">
                            Owner:{' '}
                            {customer.owner?.full_name ||
                              customer.owner?.email ||
                              'Unassigned'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Created: {formatDate(customer.created_at)}
                          </span>
                          {customer.proposals?.length > 0 && (
                            <Badge variant="secondary">
                              {customer.proposals.length} proposals
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Database Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold">{customers?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{duplicates.length}</div>
              <p className="text-sm text-muted-foreground">Duplicate Sets</p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {duplicates.reduce((acc, d) => acc + d.customers.length - 1, 0)}
              </div>
              <p className="text-sm text-muted-foreground">
                Extra Records (could be deleted)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}