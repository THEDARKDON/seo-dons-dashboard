import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Phone, Mail, Calendar, Shield } from 'lucide-react';
import Link from 'next/link';
import { RoleChangeDialog } from '@/components/admin/role-change-dialog';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getUsersData(userId: string) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single();

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Get all users
  const { data: users } = await supabase
    .from('users')
    .select(`
      *,
      voip:user_voip_settings(assigned_phone_number, caller_id_number)
    `)
    .order('created_at', { ascending: false });

  return users || [];
}

export default async function UsersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const users = await getUsersData(userId);

  if (!users) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Access denied. This page is only available to administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleColors = {
    admin: 'destructive',
    manager: 'default',
    bdr: 'secondary',
  } as const;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin">
            <Button variant="outline">← Back to Admin</Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'manager').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SDRs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'bdr').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user accounts and assign phone numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">
                      {user.first_name} {user.last_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleColors[user.role as keyof typeof roleColors]}>
                      {user.role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.voip && user.voip.length > 0 ? (
                        <>
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{user.voip[0].assigned_phone_number}</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not assigned</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <RoleChangeDialog
                        userId={user.id}
                        currentRole={user.role}
                        userName={`${user.first_name} ${user.last_name}`}
                      />
                      {user.role !== 'admin' && (
                        <>
                          <Link href={`/dashboard/admin/users/${user.id}/leads`}>
                            <Button variant="outline" size="sm">
                              Manage Leads
                            </Button>
                          </Link>
                          <Link href={`/dashboard/admin/sdrs/${user.id}`}>
                            <Button variant="ghost" size="sm">
                              View Stats
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Phone Number Management</CardTitle>
          <CardDescription>
            How to assign phone numbers to users
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>To assign a phone number to a user, run this SQL in Supabase:</p>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`INSERT INTO user_voip_settings (user_id, assigned_phone_number, caller_id_number)
VALUES (
  'user-id-here',
  '+447700158258',
  '+447700158258'
)
ON CONFLICT (user_id)
DO UPDATE SET
  assigned_phone_number = EXCLUDED.assigned_phone_number,
  caller_id_number = EXCLUDED.caller_id_number;`}
          </pre>
          <p className="text-sm text-muted-foreground mt-4">
            Replace <code>user-id-here</code> with the user&apos;s ID from the table above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
