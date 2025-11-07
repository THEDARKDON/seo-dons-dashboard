'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Search,
  Filter,
  MapPin,
  Clock,
  User,
  Building,
  Calendar,
  MessageSquare,
  Plus,
  Download,
  Eye,
} from 'lucide-react';
import { MobileCallDialog } from './mobile-call-dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

interface MobileCall {
  id: string;
  user_id: string;
  customer_id?: string;
  deal_id?: string;
  lead_id?: string;
  phone_number: string;
  contact_name?: string;
  call_type: string;
  direction: string;
  duration_seconds: number;
  status: string;
  outcome?: string;
  notes?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  called_at: string;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_company?: string;
  deal_title?: string;
  deal_stage?: string;
  lead_first_name?: string;
  lead_last_name?: string;
  lead_company?: string;
  tags?: any[];
}

interface MobileCallsClientProps {
  calls: MobileCall[];
  sdrs: any[];
  tags: any[];
}

export function MobileCallsClient({ calls: initialCalls, sdrs, tags }: MobileCallsClientProps) {
  const [calls, setCalls] = useState(initialCalls);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSdr, setSelectedSdr] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<MobileCall | null>(null);
  const [isNewCall, setIsNewCall] = useState(false);

  // Filter calls based on search and filters
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        call.phone_number.includes(searchTerm) ||
        call.contact_name?.toLowerCase().includes(searchLower) ||
        call.customer_company?.toLowerCase().includes(searchLower) ||
        call.notes?.toLowerCase().includes(searchLower) ||
        call.location_name?.toLowerCase().includes(searchLower);

      // SDR filter
      const matchesSdr = selectedSdr === 'all' || call.user_id === selectedSdr;

      // Outcome filter
      const matchesOutcome = selectedOutcome === 'all' || call.outcome === selectedOutcome;

      // Date range filter
      let matchesDate = true;
      if (selectedDateRange !== 'all') {
        const callDate = new Date(call.called_at);
        const now = new Date();

        switch (selectedDateRange) {
          case 'today':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            matchesDate = callDate >= today;
            break;
          case 'week':
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesDate = callDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesDate = callDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesSdr && matchesOutcome && matchesDate;
    });
  }, [calls, searchTerm, selectedSdr, selectedOutcome, selectedDateRange]);

  const handleNewCall = () => {
    setSelectedCall(null);
    setIsNewCall(true);
    setDialogOpen(true);
  };

  const handleViewCall = (call: MobileCall) => {
    setSelectedCall(call);
    setIsNewCall(false);
    setDialogOpen(true);
  };

  const handleCallSaved = async () => {
    // Refresh calls list
    const { data } = await supabase
      .from('mobile_calls_with_details')
      .select('*')
      .order('called_at', { ascending: false })
      .limit(500);

    if (data) {
      setCalls(data);
    }

    setDialogOpen(false);
    toast.success(isNewCall ? 'Call logged successfully' : 'Call updated successfully');
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Time', 'SDR', 'Contact', 'Phone', 'Company', 'Duration', 'Outcome', 'Notes'].join(','),
      ...filteredCalls.map(call => [
        new Date(call.called_at).toLocaleDateString(),
        new Date(call.called_at).toLocaleTimeString(),
        `${call.user_first_name} ${call.user_last_name}`,
        call.contact_name || '',
        call.phone_number,
        call.customer_company || call.lead_company || '',
        `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, '0')}`,
        call.outcome || '',
        `"${(call.notes || '').replace(/"/g, '""')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile-calls-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getOutcomeBadgeColor = (outcome?: string) => {
    switch (outcome) {
      case 'meeting_booked':
        return 'bg-green-100 text-green-800';
      case 'interested':
        return 'bg-blue-100 text-blue-800';
      case 'callback_scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'not_interested':
        return 'bg-red-100 text-red-800';
      case 'voicemail_left':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mobile Call Log</CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleNewCall} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Log Call
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by phone, name, company, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedSdr} onValueChange={setSelectedSdr}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All SDRs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SDRs</SelectItem>
                  {sdrs.map((sdr) => (
                    <SelectItem key={sdr.id} value={sdr.id}>
                      {sdr.first_name} {sdr.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedOutcome} onValueChange={setSelectedOutcome}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Outcomes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="meeting_booked">Meeting Booked</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="callback_scheduled">Callback Scheduled</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="voicemail_left">Voicemail Left</SelectItem>
                  <SelectItem value="wrong_number">Wrong Number</SelectItem>
                  <SelectItem value="no_decision">No Decision</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calls Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>SDR</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {call.direction === 'inbound' ? (
                          <PhoneIncoming className="h-4 w-4 text-blue-500" />
                        ) : (
                          <PhoneOutgoing className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <div className="text-sm">{new Date(call.called_at).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(call.called_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {call.user_first_name} {call.user_last_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{call.contact_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{call.phone_number}</div>
                        {(call.customer_company || call.lead_company) && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Building className="h-3 w-3" />
                            {call.customer_company || call.lead_company}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {call.call_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(call.duration_seconds)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {call.outcome && (
                        <Badge className={getOutcomeBadgeColor(call.outcome)}>
                          {call.outcome.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {call.location_name && (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[150px]" title={call.location_name}>
                            {call.location_name}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {call.notes && (
                        <div className="max-w-[200px] truncate" title={call.notes}>
                          {call.notes}
                        </div>
                      )}
                      {call.follow_up_date && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                          <Calendar className="h-3 w-3" />
                          Follow up: {new Date(call.follow_up_date).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCall(call)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCalls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No calls found matching your filters
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Call Dialog */}
      <MobileCallDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        call={selectedCall}
        isNew={isNewCall}
        tags={tags}
        onSave={handleCallSaved}
      />
    </>
  );
}