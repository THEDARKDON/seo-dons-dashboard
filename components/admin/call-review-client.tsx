'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Star, Search, Filter, Play } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Call {
  id: string;
  call_sid: string;
  direction: string;
  duration_seconds: number;
  status: string;
  sentiment_label?: string;
  quality_rating?: number;
  reviewed_at?: string;
  flagged_for_review?: boolean;
  created_at: string;
  users: { id: string; first_name: string; last_name: string; email: string } | null;
  customers?: { id: string; first_name: string; last_name: string; company?: string } | null;
  reviewed_user?: { first_name: string; last_name: string } | null;
}

interface SDR {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface CallReviewClientProps {
  calls: Call[];
  sdrs: SDR[];
}

const sentimentColors = {
  positive: 'bg-green-100 text-green-800',
  neutral: 'bg-gray-100 text-gray-800',
  negative: 'bg-red-100 text-red-800',
};

export function CallReviewClient({ calls, sdrs }: CallReviewClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSDR, setSelectedSDR] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'reviewed' | 'unreviewed' | 'flagged'>('all');

  // Filter calls
  const filteredCalls = calls.filter(call => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      call.users?.first_name?.toLowerCase().includes(searchLower) ||
      call.users?.last_name?.toLowerCase().includes(searchLower) ||
      call.customers?.first_name?.toLowerCase().includes(searchLower) ||
      call.customers?.last_name?.toLowerCase().includes(searchLower) ||
      call.customers?.company?.toLowerCase().includes(searchLower);

    // SDR filter
    const matchesSDR = selectedSDR === 'all' || call.users?.id === selectedSDR;

    // Review status filter
    const matchesReview =
      reviewFilter === 'all' ||
      (reviewFilter === 'reviewed' && call.reviewed_at) ||
      (reviewFilter === 'unreviewed' && !call.reviewed_at) ||
      (reviewFilter === 'flagged' && call.flagged_for_review);

    return matchesSearch && matchesSDR && matchesReview;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Call Recordings</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {filteredCalls.length} of {calls.length} calls
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by SDR or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={selectedSDR}
            onChange={(e) => setSelectedSDR(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="all">All SDRs</option>
            {sdrs.map(sdr => (
              <option key={sdr.id} value={sdr.id}>
                {sdr.first_name} {sdr.last_name}
              </option>
            ))}
          </select>

          <select
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="all">All Status</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="reviewed">Reviewed</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredCalls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No calls found matching your filters</p>
            </div>
          ) : (
            filteredCalls.map(call => {
              const user = call.users;
              const customer = call.customers;

              return (
                <Link
                  key={call.id}
                  href={`/dashboard/calls/history/${call.id}`}
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Call Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${
                          call.direction === 'outbound' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <Phone className={`h-4 w-4 ${
                            call.direction === 'outbound' ? 'text-blue-600 rotate-90' : 'text-green-600 -rotate-90'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {user ? `${user.first_name} ${user.last_name}` : 'Unknown'}
                            </p>
                            <span className="text-muted-foreground">→</span>
                            <p className="text-muted-foreground">
                              {customer
                                ? `${customer.first_name} ${customer.last_name}${customer.company ? ` (${customer.company})` : ''}`
                                : 'Unknown Customer'
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{formatDuration(call.duration_seconds || 0)}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 ml-12">
                        {call.sentiment_label && (
                          <Badge
                            variant="secondary"
                            className={sentimentColors[call.sentiment_label as keyof typeof sentimentColors]}
                          >
                            {call.sentiment_label}
                          </Badge>
                        )}
                        {call.flagged_for_review && (
                          <Badge variant="destructive">Flagged</Badge>
                        )}
                        {call.reviewed_at && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            ✓ Reviewed
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Quality Rating & Actions */}
                    <div className="flex items-center gap-4">
                      {call.quality_rating && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < call.quality_rating!
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/dashboard/calls/history/${call.id}`;
                        }}
                      >
                        <Play className="h-4 w-4" />
                        Review
                      </Button>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
