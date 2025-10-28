import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Phone, TrendingUp, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CallRecordingPlayer } from '@/components/calling/call-recording-player';

async function getCallDetails(callId: string) {
  try {
    const supabase = await createClient();

    const { data: call } = await supabase
      .from('call_recordings')
      .select(`
        *,
        customers (first_name, last_name, company, email, phone),
        deals (deal_name, deal_value, stage)
      `)
      .eq('id', callId)
      .single();

    if (!call) {
      notFound();
    }

    return call;
  } catch (error) {
    console.error('Error fetching call details:', error);
    notFound();
  }
}

const sentimentColors = {
  positive: 'success',
  neutral: 'default',
  negative: 'destructive',
} as const;

export default async function CallDetailPage({ params }: { params: { id: string } }) {
  const call = await getCallDetails(params.id);
  const customer = call.customers as any;
  const deal = call.deals as any;

  const durationMin = call.duration_seconds ? Math.floor(call.duration_seconds / 60) : 0;
  const durationSec = call.duration_seconds ? call.duration_seconds % 60 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/calls/history">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {customer ? `${customer.first_name} ${customer.last_name}` : call.to_number}
          </h1>
          <p className="text-muted-foreground">{formatDate(call.created_at)}</p>
        </div>
      </div>

      {/* Recording Player */}
      {call.recording_url && call.call_sid && (
        <CallRecordingPlayer
          callSid={call.call_sid}
          durationSeconds={call.recording_duration_seconds || call.duration_seconds || 0}
          callDetails={{
            customerName: customer ? `${customer.first_name} ${customer.last_name}` : undefined,
            date: formatDate(call.created_at)
          }}
        />
      )}

      {/* Call Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Call Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Direction</p>
                <p className="font-medium capitalize">{call.direction}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {durationMin}m {durationSec}s
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="default" className="mt-1">
                {call.status}
              </Badge>
            </div>
            {call.sentiment_label && (
              <div>
                <p className="text-sm text-muted-foreground">Sentiment</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      sentimentColors[call.sentiment_label as keyof typeof sentimentColors]
                    }
                  >
                    {call.sentiment_label}
                  </Badge>
                  {call.sentiment_score !== null && (
                    <span className="text-sm text-muted-foreground">
                      ({call.sentiment_score.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <Link
                    href={`/dashboard/customers/${call.customer_id}`}
                    className="font-medium hover:underline"
                  >
                    {customer.first_name} {customer.last_name}
                  </Link>
                </div>
                {customer.company && (
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{customer.company}</p>
                  </div>
                )}
                {customer.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="font-medium">{call.to_number}</p>
              </div>
            )}
            {deal && (
              <div>
                <p className="text-sm text-muted-foreground">Associated Deal</p>
                <Link
                  href={`/dashboard/deals/${call.deal_id}`}
                  className="font-medium hover:underline"
                >
                  {deal.deal_name}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Summary */}
      {call.ai_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{call.ai_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Topics */}
      {call.key_topics && call.key_topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {call.key_topics.map((topic: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {call.action_items && call.action_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {call.action_items.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Transcription */}
      {call.transcription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Call Transcription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4">
              <p className="whitespace-pre-wrap text-sm">{call.transcription}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {call.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{call.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
