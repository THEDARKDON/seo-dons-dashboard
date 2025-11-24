'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface CallRecord {
  id: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  duration_seconds: number;
  status: string;
  sentiment_label?: string;
  created_at: string;
  customers?: {
    first_name: string;
    last_name: string;
    company?: string;
  } | null;
}

interface CallHistoryMiniProps {
  calls: CallRecord[];
}

const sentimentColors = {
  positive: 'bg-green-100 text-green-800',
  neutral: 'bg-gray-100 text-gray-800',
  negative: 'bg-red-100 text-red-800',
};

export function CallHistoryMini({ calls }: CallHistoryMiniProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  if (calls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Recent Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No calls yet today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Recent Calls
        </CardTitle>
        <Link href="/dashboard/calls/history">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {calls.slice(0, 5).map((call) => {
            const customer = call.customers;
            const displayName = customer
              ? `${customer.first_name} ${customer.last_name}`
              : call.direction === 'outbound'
              ? call.to_number
              : call.from_number;

            return (
              <Link
                key={call.id}
                href={`/dashboard/calls/history/${call.id}`}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {/* Direction icon */}
                <div className={`rounded-full p-2 ${
                  call.direction === 'outbound' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  <Phone className={`h-4 w-4 ${
                    call.direction === 'outbound' ? 'text-blue-600 rotate-90' : 'text-green-600 -rotate-90'
                  }`} />
                </div>

                {/* Call details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{displayName}</p>
                      {customer?.company && (
                        <p className="text-xs text-muted-foreground truncate">{customer.company}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatDuration(call.duration_seconds)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {call.sentiment_label && (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${sentimentColors[call.sentiment_label as keyof typeof sentimentColors]}`}
                      >
                        {call.sentiment_label}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
