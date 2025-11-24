import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { formatDate } from '@/lib/utils';
import { Phone, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CallReviewClient } from '@/components/admin/call-review-client';

async function getCallsForReview() {
  const supabase = await createClient();
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Get current user
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', userId)
    .single();

  // Only admins can access this page
  if (user?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get all SDRs for filtering
  const { data: sdrs } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('role', 'bdr')
    .order('first_name', { ascending: true });

  // Get call recordings with user and customer info
  const { data: calls } = await supabase
    .from('call_recordings')
    .select(`
      *,
      users!call_recordings_user_id_fkey (id, first_name, last_name, email),
      customers (id, first_name, last_name, company),
      reviewed_user:reviewed_by (first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  return {
    calls: calls || [],
    sdrs: sdrs || [],
  };
}

export default async function CallReviewPage() {
  const { calls, sdrs } = await getCallsForReview();

  // Calculate stats
  const totalCalls = calls.length;
  const reviewedCalls = calls.filter(c => c.reviewed_at).length;
  const flaggedCalls = calls.filter(c => c.flagged_for_review).length;
  const avgDuration = totalCalls > 0
    ? Math.round(calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / totalCalls)
    : 0;

  const sentimentBreakdown = {
    positive: calls.filter(c => c.sentiment_label === 'positive').length,
    neutral: calls.filter(c => c.sentiment_label === 'neutral').length,
    negative: calls.filter(c => c.sentiment_label === 'negative').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Call Review Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Review and analyze SDR call recordings
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 100 recordings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reviewedCalls}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCalls > 0 ? Math.round((reviewedCalls / totalCalls) * 100) : 0}% completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Flagged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{flaggedCalls}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Needs attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(avgDuration / 60)}m {avgDuration % 60}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per call
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{sentimentBreakdown.positive}</div>
              <p className="text-sm text-muted-foreground mt-1">Positive</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-600">{sentimentBreakdown.neutral}</div>
              <p className="text-sm text-muted-foreground mt-1">Neutral</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{sentimentBreakdown.negative}</div>
              <p className="text-sm text-muted-foreground mt-1">Negative</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call List with Filters */}
      <CallReviewClient calls={calls} sdrs={sdrs} />
    </div>
  );
}
