import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { formatDateTime } from '@/lib/utils';
import { Plus, Phone } from 'lucide-react';
import Link from 'next/link';

const outcomeColors = {
  successful: 'success',
  no_answer: 'secondary',
  voicemail: 'secondary',
  callback_scheduled: 'default',
  not_interested: 'destructive',
} as const;

async function getCalls(userId: string) {
  const supabase = await createClient();

  // Get user's Supabase ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return [];
  }

  // Get calls
  const { data: calls } = await supabase
    .from('activities')
    .select(`
      *,
      customers (first_name, last_name, company, phone),
      deals (deal_name)
    `)
    .eq('user_id', user.id)
    .eq('activity_type', 'call')
    .order('created_at', { ascending: false })
    .limit(50);

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
  const successfulCalls = calls.filter(c => c.outcome === 'successful').length;
  const totalCalls = calls.length;
  const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call Log</h1>
          <p className="text-muted-foreground">Track your daily calls and outcomes</p>
        </div>
        <Link href="/dashboard/calls/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Log Call
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{callsToday}</p>
              <p className="text-sm text-muted-foreground">Calls Today</p>
              <p className="text-xs text-muted-foreground mt-1">Target: 50</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{totalCalls}</p>
              <p className="text-sm text-muted-foreground">Total Calls</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{successRate}%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No calls logged yet</p>
              <Link href="/dashboard/calls/new">
                <Button>Log Your First Call</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {calls.map((call) => {
                const customer = call.customers as any;
                const deal = call.deals as any;

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
                            {customer ? (
                              <>
                                {customer.first_name} {customer.last_name}
                                {customer.company && (
                                  <span className="text-muted-foreground ml-2">
                                    · {customer.company}
                                  </span>
                                )}
                              </>
                            ) : (
                              'Unknown Contact'
                            )}
                          </p>
                          {call.subject && (
                            <p className="text-sm text-muted-foreground">{call.subject}</p>
                          )}
                          {deal && (
                            <p className="text-sm text-muted-foreground">
                              Related to: {deal.deal_name}
                            </p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          {call.outcome && (
                            <Badge variant={outcomeColors[call.outcome as keyof typeof outcomeColors]}>
                              {call.outcome.replace('_', ' ')}
                            </Badge>
                          )}
                          {call.duration_minutes && (
                            <p className="text-sm text-muted-foreground">
                              {call.duration_minutes} min
                            </p>
                          )}
                        </div>
                      </div>
                      {call.description && (
                        <p className="text-sm text-muted-foreground">{call.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(call.completed_at || call.created_at)}
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
