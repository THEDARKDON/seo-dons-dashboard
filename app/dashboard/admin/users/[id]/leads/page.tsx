import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, Plus, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import LeadImportForm from '@/components/admin/lead-import-form';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getUserAndImports(adminClerkId: string, targetUserId: string) {
  const supabase = await createClient();

  // Check if admin
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', adminClerkId)
    .single();

  if (!adminUser || adminUser.role !== 'admin') {
    return { isAdmin: false, targetUser: null, imports: [] };
  }

  // Get target user
  const { data: targetUser } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, role')
    .eq('id', targetUserId)
    .single();

  if (!targetUser) {
    return { isAdmin: true, targetUser: null, imports: [] };
  }

  // Get import history for this user
  const { data: imports } = await supabase
    .from('lead_imports')
    .select(`
      *,
      imported_by_user:users!lead_imports_imported_by_fkey(first_name, last_name)
    `)
    .eq('assigned_to', targetUserId)
    .order('created_at', { ascending: false })
    .limit(20);

  return { isAdmin: true, targetUser, imports: imports || [] };
}

const statusColors = {
  pending: 'secondary',
  processing: 'default',
  completed: 'success',
  failed: 'destructive',
} as const;

const statusIcons = {
  pending: AlertCircle,
  processing: AlertCircle,
  completed: CheckCircle,
  failed: XCircle,
};

export default async function ManageUserLeadsPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const { isAdmin, targetUser, imports } = await getUserAndImports(userId, params.id);

  if (!isAdmin) {
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

  if (!targetUser) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">User not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manage Leads for {targetUser.first_name} {targetUser.last_name}
          </h1>
          <p className="text-muted-foreground">
            Import leads via CSV or add manually
          </p>
        </div>
        <Link href="/dashboard/admin/users">
          <Button variant="outline">← Back to Users</Button>
        </Link>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>SDR Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">
                {targetUser.first_name} {targetUser.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{targetUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge>{targetUser.role.toUpperCase()}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Form */}
      <LeadImportForm userId={targetUser.id} />

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>
            Previous lead imports for this SDR
          </CardDescription>
        </CardHeader>
        <CardContent>
          {imports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No imports yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Import leads using the form above
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Successful</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Duplicates</TableHead>
                  <TableHead>Imported By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((imp: any) => {
                  const StatusIcon = statusIcons[imp.status as keyof typeof statusIcons];
                  return (
                    <TableRow key={imp.id}>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(imp.created_at).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {imp.import_type?.toUpperCase() || 'MANUAL'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge variant={statusColors[imp.status as keyof typeof statusColors]}>
                            {imp.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{imp.total_rows || 0}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">
                          {imp.successful_imports || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600 font-medium">
                          {imp.failed_imports || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-orange-600 font-medium">
                          {imp.duplicate_count || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {imp.imported_by_user?.first_name} {imp.imported_by_user?.last_name}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
