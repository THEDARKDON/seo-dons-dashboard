'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Mail,
  MailOpen,
  MousePointerClick,
  Reply,
  AlertCircle,
  Search,
  Phone,
  Building2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  email_opened: boolean;
  email_opened_count: number;
  last_email_opened_at: string;
  email_clicked: boolean;
  email_replied: boolean;
  email_bounced: boolean;
  instantly_campaign_id: string;
  instantly_status: string;
  created_at: string;
}

export default function EmailEngagementPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'opened' | 'clicked' | 'replied' | 'bounced'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();

      if (data.leads) {
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    // Apply engagement filter
    const matchesFilter =
      filter === 'all' ||
      (filter === 'opened' && lead.email_opened) ||
      (filter === 'clicked' && lead.email_clicked) ||
      (filter === 'replied' && lead.email_replied) ||
      (filter === 'bounced' && lead.email_bounced);

    // Apply search
    const matchesSearch =
      !searchQuery ||
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Calculate stats
  const stats = {
    total: leads.length,
    opened: leads.filter((l) => l.email_opened).length,
    clicked: leads.filter((l) => l.email_clicked).length,
    replied: leads.filter((l) => l.email_replied).length,
    bounced: leads.filter((l) => l.email_bounced).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-gray-500">Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Engagement</h1>
        <p className="text-gray-600">Track leads who opened and engaged with emails</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Mail className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('opened')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Opened</p>
              <p className="text-2xl font-bold text-blue-600">{stats.opened}</p>
              <p className="text-xs text-gray-500">
                {stats.total > 0 ? Math.round((stats.opened / stats.total) * 100) : 0}% open rate
              </p>
            </div>
            <MailOpen className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('clicked')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clicked</p>
              <p className="text-2xl font-bold text-purple-600">{stats.clicked}</p>
              <p className="text-xs text-gray-500">
                {stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0}% CTR
              </p>
            </div>
            <MousePointerClick className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('replied')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Replied</p>
              <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
              <p className="text-xs text-gray-500">Hot leads</p>
            </div>
            <Reply className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('bounced')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bounced</p>
              <p className="text-2xl font-bold text-red-600">{stats.bounced}</p>
              <p className="text-xs text-gray-500">Invalid emails</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'opened' ? 'default' : 'outline'}
            onClick={() => setFilter('opened')}
          >
            Opened
          </Button>
          <Button
            variant={filter === 'clicked' ? 'default' : 'outline'}
            onClick={() => setFilter('clicked')}
          >
            Clicked
          </Button>
          <Button
            variant={filter === 'replied' ? 'default' : 'outline'}
            onClick={() => setFilter('replied')}
          >
            Replied
          </Button>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {filteredLeads.length === 0 ? (
          <Card className="p-12 text-center">
            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No leads found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter !== 'all'
                ? `No leads with ${filter} emails`
                : 'Import leads from Instantly.ai to start tracking'}
            </p>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Engagement Icons */}
                  <div className="flex flex-col gap-1">
                    {lead.email_opened && (
                      <div className="flex items-center gap-1" title="Email opened">
                        <MailOpen className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-blue-600">{lead.email_opened_count}x</span>
                      </div>
                    )}
                    {lead.email_clicked && (
                      <MousePointerClick className="h-4 w-4 text-purple-500" title="Link clicked" />
                    )}
                    {lead.email_replied && (
                      <Reply className="h-4 w-4 text-green-500" title="Replied to email" />
                    )}
                    {lead.email_bounced && (
                      <AlertCircle className="h-4 w-4 text-red-500" title="Email bounced" />
                    )}
                  </div>

                  {/* Lead Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {lead.first_name} {lead.last_name}
                      </Link>
                      {lead.email_replied && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium">
                          HOT LEAD
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}
                      {lead.company && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {lead.company}
                        </div>
                      )}
                    </div>

                    {lead.last_email_opened_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last opened {formatDistanceToNow(new Date(lead.last_email_opened_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/leads/${lead.id}`}>
                    <Button size="sm">View Lead</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
