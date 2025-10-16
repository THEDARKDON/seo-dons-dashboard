import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemSettingsForm } from '@/components/settings/system-settings-form';

async function getAdminSettings(userId: string) {
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single();

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Get system statistics
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  const { count: totalCalls } = await supabase
    .from('call_recordings')
    .select('*', { count: 'exact', head: true });

  const { count: totalDeals } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true });

  // Get phone numbers
  const { data: phoneNumbers } = await supabase
    .from('user_voip_settings')
    .select('assigned_phone_number')
    .not('assigned_phone_number', 'is', null);

  return {
    totalUsers: totalUsers || 0,
    totalLeads: totalLeads || 0,
    totalCalls: totalCalls || 0,
    totalDeals: totalDeals || 0,
    phoneNumbers: phoneNumbers || [],
  };
}

export default async function AdminSettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const settings = await getAdminSettings(userId);

  if (!settings) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-gray-400 mt-2">
          Manage system-wide settings and configurations
        </p>
      </div>

      <div className="space-y-6">
        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              View key metrics and system statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-3xl font-bold mt-1">{settings.totalUsers}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Leads</p>
                <p className="text-3xl font-bold mt-1">{settings.totalLeads}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Calls</p>
                <p className="text-3xl font-bold mt-1">{settings.totalCalls}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Deals</p>
                <p className="text-3xl font-bold mt-1">{settings.totalDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Twilio Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Twilio Configuration</CardTitle>
            <CardDescription>
              Manage your Twilio calling integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Account SID</label>
                <p className="text-lg mt-1 font-mono bg-gray-800 p-2 rounded">
                  {process.env.TWILIO_ACCOUNT_SID || 'Not configured'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Region</label>
                <p className="text-lg mt-1">
                  {process.env.TWILIO_REGION || 'Not configured'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Phone Numbers Assigned</label>
                <div className="mt-2 space-y-2">
                  {settings.phoneNumbers.length > 0 ? (
                    settings.phoneNumbers.map((phone: any, idx: number) => (
                      <p key={idx} className="font-mono text-lg">
                        {phone.assigned_phone_number}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-400">No phone numbers assigned yet</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-400 mb-2">
                  Configuration Instructions
                </p>
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                  <li>Twilio credentials are configured in .env.local</li>
                  <li>Purchase phone numbers at <a href="https://console.twilio.com" target="_blank" className="text-blue-400 hover:underline">console.twilio.com</a></li>
                  <li>Assign numbers to users via the User Management page</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure system-wide preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SystemSettingsForm />
          </CardContent>
        </Card>

        {/* Database Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Database Configuration</CardTitle>
            <CardDescription>
              Supabase database connection information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Supabase URL</label>
                <p className="text-lg mt-1 font-mono bg-gray-800 p-2 rounded break-all">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-lg mt-1 text-green-500">
                  ✓ Connected
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys & Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>API Keys & Integrations</CardTitle>
            <CardDescription>
              Manage third-party integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">OpenAI API</label>
                <p className="text-lg mt-1">
                  {process.env.OPENAI_API_KEY ? (
                    <span className="text-green-500">✓ Configured</span>
                  ) : (
                    <span className="text-gray-400">Not configured</span>
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">LinkedIn Integration</label>
                <p className="text-lg mt-1">
                  {process.env.LINKEDIN_CLIENT_ID ? (
                    <span className="text-green-500">✓ Configured</span>
                  ) : (
                    <span className="text-gray-400">Not configured</span>
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">HubSpot Integration</label>
                <p className="text-lg mt-1">
                  {process.env.HUBSPOT_CLIENT_ID ? (
                    <span className="text-green-500">✓ Configured</span>
                  ) : (
                    <span className="text-gray-400">Not configured</span>
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Apollo API</label>
                <p className="text-lg mt-1">
                  {process.env.APOLLO_API_KEY ? (
                    <span className="text-green-500">✓ Configured</span>
                  ) : (
                    <span className="text-gray-400">Not configured</span>
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Slack Integration</label>
                <p className="text-lg mt-1">
                  {process.env.SLACK_WEBHOOK_URL ? (
                    <span className="text-green-500">✓ Configured</span>
                  ) : (
                    <span className="text-gray-400">Not configured</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-900">
          <CardHeader>
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that require caution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <p className="text-sm font-medium text-red-400 mb-2">
                  ⚠️ Critical Actions
                </p>
                <p className="text-sm text-gray-300">
                  To perform critical system operations like data exports, backups, or system resets,
                  use the Supabase dashboard directly at{' '}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    className="text-red-400 hover:underline"
                  >
                    supabase.com/dashboard
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
