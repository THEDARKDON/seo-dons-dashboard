import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { formatDateTime } from '@/lib/utils';
import { Phone, History, Play } from 'lucide-react';
import Link from 'next/link';

async function getCalls(userId: string) {
  const supabase = await createClient();

  // Get user's Supabase ID
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return [];
  }

  // Get call recordings based on user role
  let query = supabase
    .from('call_recordings')
    .select(`
      *,
      leads:lead_id(id, first_name, last_name, company),
      customers:customer_id(id, name, company_name),
      deals:deal_id(id, title, value),
      users:user_id(id, first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  // BDRs can only see their own calls
  if (user.role === 'bdr') {
    query = query.eq('user_id', user.id);
  }

  const { data: calls } = await query;

  return calls || [];
}

export default async function CallsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const calls = await getCalls(userId);

  // Calculate stats
  const today = new Date().toDateString();
  const callsToday = calls.filter(c => new Date(c.created_at).toDateString() === today).length;
  const completedCalls = calls.filter(c => c.status === 'completed').length;
  const totalCalls = calls.length;
  const totalDuration = Math.floor(calls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / 60);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calls</h1>
          <p className="text-muted-foreground">Make calls and view call history with recordings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Calls Today</CardDescription>
              <CardTitle className="text-3xl">{callsToday}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Target: 50</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Calls</CardDescription>
              <CardTitle className="text-3xl">{totalCalls}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{completedCalls} completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Duration</CardDescription>
              <CardTitle className="text-3xl">{totalDuration}m</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">All calls</p>
            </CardContent>
          </Card>
      </div>

      {/* Call History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>Call History</CardTitle>
          </div>
          <CardDescription>View and manage your call recordings</CardDescription>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No calls recorded yet</p>
              <p className="text-sm text-muted-foreground">Use the panel above to make your first call</p>
            </div>
          ) : (
            <div className="space-y-3">
              {calls.map((call: any) => {
                const lead = call.leads;
                const customer = call.customers;
                const deal = call.deals;
                const user = call.users;

                return (
                  <div
                    key={call.id}
                    className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="rounded-full bg-primary/10 p-2">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {lead ? (
                              <>
                                {lead.first_name} {lead.last_name}
                                {lead.company && (
                                  <span className="text-muted-foreground ml-2">· {lead.company}</span>
                                )}
                              </>
                            ) : customer ? (
                              <>
                                {customer.name}
                                {customer.company_name && (
                                  <span className="text-muted-foreground ml-2">· {customer.company_name}</span>
                                )}
                              </>
                            ) : (
                              call.to_number
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {call.direction === 'outbound' ? 'Outbound' : 'Inbound'} · {call.from_number}
                          </p>
                          {deal && (
                            <p className="text-sm text-muted-foreground">Related to: {deal.title}</p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                            {call.status}
                          </Badge>
                          {call.duration_seconds && (
                            <p className="text-sm text-muted-foreground">{Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s</p>
                          )}
                          {call.recording_url && (
                            <Button variant="ghost" size="sm" className="h-6 px-2">
                              <Play className="h-3 w-3 mr-1" />
                              Play
                            </Button>
                          )}
                        </div>
                      </div>
                      {call.transcription_text && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {call.transcription_text}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(call.created_at)} · By {user?.first_name} {user?.last_name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
