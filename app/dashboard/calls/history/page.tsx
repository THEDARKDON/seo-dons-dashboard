import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { formatDate } from '@/lib/utils';
import { Phone, Download, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';

async function getCallHistory(userId: string) {
  try {
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

    // Try to get call recordings - may fail if table doesn't exist
    try {
      const query = supabase
        .from('call_recordings')
        .select(`
          *,
          customers (first_name, last_name, company),
          deals (deal_name)
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filters
      if (user.role === 'bdr') {
        query.eq('user_id', user.id);
      }

      const { data: calls } = await query;
      return calls || [];
    } catch (e) {
      console.warn('call_recordings table not found - skipping');
      return [];
    }
  } catch (error) {
    console.error('Error fetching call history:', error);
    return [];
  }
}

const statusColors = {
  completed: 'success',
  'in-progress': 'default',
  failed: 'destructive',
  'no-answer': 'secondary',
} as const;

const sentimentColors = {
  positive: 'success',
  neutral: 'default',
  negative: 'destructive',
} as const;

export default async function CallHistoryPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const calls = await getCallHistory(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call History</h1>
          <p className="text-muted-foreground">
            View and analyze your call recordings
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Calls ({calls.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No calls recorded yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Make your first call to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {calls.map((call) => {
                const customer = call.customers as any;
                const deal = call.deals as any;
                const durationMin = call.duration_seconds
                  ? Math.floor(call.duration_seconds / 60)
                  : 0;
                const durationSec = call.duration_seconds
                  ? call.duration_seconds % 60
                  : 0;

                return (
                  <Link
                    key={call.id}
                    href={`/dashboard/calls/history/${call.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="rounded-full bg-muted p-3">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {customer
                              ? `${customer.first_name} ${customer.last_name}`
                              : call.to_number}
                          </p>
                          {customer?.company && (
                            <span className="text-sm text-muted-foreground">
                              · {customer.company}
                            </span>
                          )}
                        </div>
                        {deal && (
                          <p className="text-sm text-muted-foreground">
                            Deal: {deal.deal_name}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            {call.direction === 'outbound' ? '→' : '←'}{' '}
                            {call.direction}
                          </span>
                          <span>
                            {durationMin}m {durationSec}s
                          </span>
                          <span>{formatDate(call.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {call.sentiment_label && (
                        <Badge
                          variant={
                            sentimentColors[
                              call.sentiment_label as keyof typeof sentimentColors
                            ]
                          }
                        >
                          {call.sentiment_label}
                        </Badge>
                      )}
                      <Badge
                        variant={
                          statusColors[call.status as keyof typeof statusColors] ||
                          'default'
                        }
                      >
                        {call.status}
                      </Badge>
                      {call.transcription && (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      {call.recording_url && (
                        <Download className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
