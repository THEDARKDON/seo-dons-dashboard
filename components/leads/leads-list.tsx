'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  category?: string;
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

const categoryConfig: Record<string, { label: string; color: string }> = {
  cold: { label: 'Cold Lead', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  warm: { label: 'Warm Lead', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  hot: { label: 'Hot Lead', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  instantly_opened: { label: 'Instantly Opened', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  email_replied: { label: 'Email Replied', color: 'bg-green-100 text-green-700 border-green-300' },
  meeting_scheduled: { label: 'Meeting Scheduled', color: 'bg-teal-100 text-teal-700 border-teal-300' },
  follow_up: { label: 'Follow Up', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  not_interested: { label: 'Not Interested', color: 'bg-red-100 text-red-700 border-red-300' },
};

export function LeadsList({ initialLeads }: LeadsListProps) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [assignToUserId, setAssignToUserId] = useState<string>('');
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // Get unique sources and categories
  const sources = Array.from(new Set(leads.map(l => l.lead_source).filter(Boolean)));
  const categories = Array.from(new Set(leads.map(l => l.category).filter(Boolean)));

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
    const matchesCategory = categoryFilter === 'all' || lead.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesSource && matchesCategory;
  });

  const updateLeadCategory = async (leadId: string, category: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });

      if (response.ok) {
        // Update local state
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === leadId ? { ...lead, category } : lead
          )
        );
        setEditingCategory(null);
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  // Fetch admin status and users
  useEffect(() => {
    async function fetchAdminAndUsers() {
      try {
        const roleRes = await fetch('/api/user/role');
        const roleData = await roleRes.json();
        const adminStatus = roleData.role === 'admin';
        setIsAdmin(adminStatus);

        if (adminStatus) {
          const usersRes = await fetch('/api/admin/users');
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      } catch (error) {
        console.error('Error fetching admin status:', error);
      }
    }
    fetchAdminAndUsers();
  }, []);

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (!assignToUserId || selectedLeads.size === 0) return;

    setBulkAssigning(true);
    try {
      const response = await fetch('/api/admin/leads/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
          assignToUserId,
        }),
      });

      if (response.ok) {
        // Refresh the page to show updated assignments
        router.refresh();
        setSelectedLeads(new Set());
        setShowBulkAssign(false);
        setAssignToUserId('');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to assign leads'}`);
      }
    } catch (error) {
      console.error('Error bulk assigning leads:', error);
      alert('Failed to assign leads');
    } finally {
      setBulkAssigning(false);
    }
  };

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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
              {isAdmin && selectedLeads.size > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedLeads.size} selected</Badge>
                  <Button
                    size="sm"
                    onClick={() => setShowBulkAssign(true)}
                  >
                    Assign to SDR
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedLeads(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
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

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          </div>
          {isAdmin && filteredLeads.length > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Checkbox
                checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all {filteredLeads.length} leads
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' || categoryFilter !== 'all'
                ? 'No leads match your filters'
                : 'No leads yet'}
            </p>
            {!searchTerm && statusFilter === 'all' && sourceFilter === 'all' && categoryFilter === 'all' && (
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
                  {/* Checkbox for admin */}
                  {isAdmin && (
                    <div className="flex-shrink-0 mr-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeads.has(lead.id)}
                        onCheckedChange={() => toggleLeadSelection(lead.id)}
                      />
                    </div>
                  )}

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

                        {/* Category Badge with Inline Edit */}
                        {editingCategory === lead.id ? (
                          <div onClick={(e) => e.preventDefault()}>
                            <Select
                              value={lead.category || ''}
                              onValueChange={(value) => updateLeadCategory(lead.id, value)}
                            >
                              <SelectTrigger className="h-6 w-40 text-xs">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(categoryConfig).map(([value, config]) => (
                                  <SelectItem key={value} value={value} className="text-xs">
                                    {config.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`text-xs cursor-pointer border ${
                              lead.category && categoryConfig[lead.category]
                                ? categoryConfig[lead.category].color
                                : 'bg-gray-50 text-gray-600 border-gray-300'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingCategory(lead.id);
                            }}
                          >
                            {lead.category && categoryConfig[lead.category]
                              ? categoryConfig[lead.category].label
                              : 'Set Category'}
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

    {/* Bulk Assign Dialog */}
    <Dialog open={showBulkAssign} onOpenChange={setShowBulkAssign}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Leads to SDR</DialogTitle>
          <DialogDescription>
            Assign {selectedLeads.size} selected lead{selectedLeads.size !== 1 ? 's' : ''} to an SDR
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="block text-sm font-medium mb-2">Select SDR</label>
          <Select value={assignToUserId} onValueChange={setAssignToUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an SDR..." />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowBulkAssign(false)}
            disabled={bulkAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkAssign}
            disabled={!assignToUserId || bulkAssigning}
          >
            {bulkAssigning ? 'Assigning...' : 'Assign Leads'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
