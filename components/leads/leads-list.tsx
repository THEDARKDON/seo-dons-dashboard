'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Mail,
  Phone,
  User,
  Search,
  ArrowRight,
  Flame,
} from 'lucide-react';
import Link from 'next/link';
import { ClickToCallButton } from '@/components/calling/click-to-call-button';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  status: string;
  lead_score: number;
  lead_source?: string;
  created_at: string;
  users?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface LeadsListProps {
  initialLeads: Lead[];
}

const statusColors = {
  new: 'default',
  contacted: 'secondary',
  qualified: 'default',
  unqualified: 'destructive',
  converted: 'success',
  lost: 'destructive',
} as const;

const statusLabels = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  unqualified: 'Unqualified',
  converted: 'Converted',
  lost: 'Lost',
};

export function LeadsList({ initialLeads }: LeadsListProps) {
  const router = useRouter();
  const [leads] = useState(initialLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Get unique sources
  const sources = Array.from(new Set(leads.map(l => l.lead_source).filter(Boolean)));

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      searchTerm === '' ||
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.lead_source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const getScoreBadge = (score: number) => {
    if (score >= 70) {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <Flame className="h-3 w-3 mr-1" />
          Hot {score}
        </Badge>
      );
    } else if (score >= 40) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          Warm {score}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          Cold {score}
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
          <div className="flex gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="unqualified">Unqualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>

            {/* Source Filter */}
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map(source => (
                  <SelectItem key={source} value={source!}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all'
                ? 'No leads match your filters'
                : 'No leads yet'}
            </p>
            {!searchTerm && statusFilter === 'all' && sourceFilter === 'all' && (
              <div className="flex gap-2 justify-center">
                <Link href="/dashboard/leads/new">
                  <Button>Create Lead</Button>
                </Link>
                <Link href="/dashboard/leads/import">
                  <Button variant="outline">Import CSV</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => {
              const assignedUser = lead.users;

              return (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    {/* Lead Score Badge */}
                    <div className="flex-shrink-0">
                      {getScoreBadge(lead.lead_score)}
                    </div>

                    {/* Lead Info */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-medium">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <Badge variant={statusColors[lead.status as keyof typeof statusColors]}>
                          {statusLabels[lead.status as keyof typeof statusLabels]}
                        </Badge>
                        {lead.lead_source && (
                          <Badge variant="outline" className="text-xs">
                            {lead.lead_source}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {lead.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {lead.company}
                          </span>
                        )}
                        {lead.job_title && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {lead.job_title}
                          </span>
                        )}
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {lead.email}
                          </span>
                        )}
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {lead.phone}
                          </span>
                        )}
                      </div>

                      {assignedUser && (
                        <p className="text-xs text-muted-foreground">
                          Assigned to: {assignedUser.first_name} {assignedUser.last_name}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </Link>

                  {/* Call Button */}
                  <div className="flex-shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
                    {lead.phone && (
                      <ClickToCallButton
                        phoneNumber={lead.phone}
                        leadId={lead.id}
                        customerName={`${lead.first_name} ${lead.last_name}`}
                        customerEmail={lead.email}
                        variant="outline"
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
