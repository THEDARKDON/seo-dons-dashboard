import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsForm } from '@/components/settings/settings-form';

async function getUserSettings(userId: string) {
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('users')
    .select(`
      id,
      clerk_id,
      email,
      first_name,
      last_name,
      role,
      team_id,
      avatar_url,
      is_active,
      created_at,
      updated_at,
      voip:user_voip_settings(*)
    `)
    .eq('clerk_id', userId)
    .single();

  return user;
}

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await getUserSettings(userId);

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-400 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm user={user} />
          </CardContent>
        </Card>

        {/* VoIP Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Calling Settings</CardTitle>
            <CardDescription>
              Configure your VoIP settings for making calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Assigned Phone Number</label>
                <p className="text-lg mt-1">
                  {user.voip?.[0]?.assigned_phone_number || 'Not assigned'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Contact an administrator to get a phone number assigned
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Caller ID Number</label>
                <p className="text-lg mt-1">
                  {user.voip?.[0]?.caller_id_number || user.voip?.[0]?.assigned_phone_number || 'Not configured'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  This number will be displayed when you make calls
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Auto Record Calls</label>
                <p className="text-lg mt-1">
                  {user.voip?.[0]?.auto_record === false ? 'Disabled' : 'Enabled'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  All calls are automatically recorded by default
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account status and role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Role</label>
                <p className="text-lg mt-1 capitalize">{user.role}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Account Created</label>
                <p className="text-lg mt-1">
                  {new Date(user.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Last Updated</label>
                <p className="text-lg mt-1">
                  {new Date(user.updated_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
