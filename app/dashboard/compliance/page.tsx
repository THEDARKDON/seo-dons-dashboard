import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { formatDate } from '@/lib/utils';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

async function getComplianceData(userId: string) {
  try {
    const supabase = await createClient();

    // Get user's Supabase ID
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return { consents: [], customers: [] };
    }

    // Try to get consent records - may fail if table doesn't exist
    let consents: any[] = [];
    try {
      const { data } = await supabase
        .from('consent_records')
        .select(`
          *,
          customers (first_name, last_name, company, email)
        `)
        .order('created_at', { ascending: false });
      consents = data || [];
    } catch (e) {
      console.warn('consent_records table not found - skipping');
    }

    // Get customers
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('status', 'active');

    return { consents, customers: customers || [] };
  } catch (error) {
    console.error('Error fetching compliance data:', error);
    return { consents: [], customers: [] };
  }
}

export default async function CompliancePage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const { consents, customers } = await getComplianceData(userId);

  // Calculate compliance stats
  const totalConsents = consents.length;
  const activeConsents = consents.filter((c) => c.consent_given && !c.revoked).length;
  const revokedConsents = consents.filter((c) => c.revoked).length;
  const tcpaConsents = consents.filter(
    (c) => c.consent_type === 'tcpa_call' && c.consent_given && !c.revoked
  ).length;
  const gdprConsents = consents.filter(
    (c) => c.consent_type === 'gdpr_processing' && c.consent_given && !c.revoked
  ).length;

  // Get customers with consent records
  const customersWithConsent = new Set(
    consents.filter((c) => c.consent_given && !c.revoked).map((c) => c.customer_id)
  );
  const customersWithoutConsent = customers.filter(
    (c) => !customersWithConsent.has(c.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Management</h1>
          <p className="text-muted-foreground">
            TCPA & GDPR consent tracking and management
          </p>
        </div>
      </div>

      {/* Compliance Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">Active Consents</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{activeConsents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-muted-foreground">TCPA Consents</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{tcpaConsents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-purple-600" />
              <p className="text-sm text-muted-foreground">GDPR Consents</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{gdprConsents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-muted-foreground">Revoked</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{revokedConsents}</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Without Consent */}
      {customersWithoutConsent.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle>Customers Without Consent ({customersWithoutConsent.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customersWithoutConsent.slice(0, 10).map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-3"
                >
                  <div>
                    <p className="font-medium">
                      {customer.first_name} {customer.last_name}
                    </p>
                    {customer.company && (
                      <p className="text-sm text-muted-foreground">{customer.company}</p>
                    )}
                  </div>
                  <Link href={`/dashboard/customers/${customer.id}`}>
                    <Button variant="outline" size="sm">
                      View Customer
                    </Button>
                  </Link>
                </div>
              ))}
              {customersWithoutConsent.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{customersWithoutConsent.length - 10} more customers
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Consent Records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Consent Records ({totalConsents})</CardTitle>
        </CardHeader>
        <CardContent>
          {consents.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No consent records yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start collecting consent from your customers
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {consents.slice(0, 20).map((consent) => {
                const customer = consent.customers as any;
                const isActive = consent.consent_given && !consent.revoked;

                return (
                  <div
                    key={consent.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div>
                        {isActive ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                        ) : consent.revoked ? (
                          <XCircle className="h-5 w-5 text-red-600 mt-1" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {customer
                              ? `${customer.first_name} ${customer.last_name}`
                              : 'Unknown Customer'}
                          </p>
                          {customer?.company && (
                            <span className="text-sm text-muted-foreground">
                              · {customer.company}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="capitalize">
                            {consent.consent_type.replace(/_/g, ' ')}
                          </span>
                          <span className="capitalize">{consent.consent_method}</span>
                          <span>
                            {consent.revoked
                              ? `Revoked ${formatDate(consent.revoked_date)}`
                              : formatDate(consent.consent_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={isActive ? 'success' : 'destructive'}>
                        {consent.revoked ? 'Revoked' : consent.consent_given ? 'Active' : 'Denied'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">TCPA (Telephone Consumer Protection Act)</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Obtain prior express written consent before making marketing calls</li>
              <li>• Keep records of consent with date, time, and method</li>
              <li>• Honor Do Not Call requests immediately</li>
              <li>• Do not call before 8 AM or after 9 PM local time</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">GDPR (General Data Protection Regulation)</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Obtain explicit consent for data processing</li>
              <li>• Allow users to withdraw consent at any time</li>
              <li>• Provide clear privacy policies</li>
              <li>• Enable data export and deletion upon request</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
