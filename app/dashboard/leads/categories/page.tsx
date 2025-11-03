'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Tag, Users, Filter } from 'lucide-react';
import Link from 'next/link';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  category: string;
  lead_source: string;
  status: string;
  created_at: string;
}

const PREDEFINED_CATEGORIES = [
  { value: 'cold', label: 'Cold Lead', color: 'bg-gray-100 text-gray-700' },
  { value: 'warm', label: 'Warm Lead', color: 'bg-blue-100 text-blue-700' },
  { value: 'hot', label: 'Hot Lead', color: 'bg-orange-100 text-orange-700' },
  { value: 'instantly_opened', label: 'Instantly Opened', color: 'bg-purple-100 text-purple-700' },
  { value: 'email_replied', label: 'Email Replied', color: 'bg-green-100 text-green-700' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'bg-teal-100 text-teal-700' },
  { value: 'follow_up', label: 'Follow Up', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-red-100 text-red-700' },
];

export default function LeadCategoriesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<string>('');

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

  const updateLeadCategory = async (leadId: string, category: string) => {
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      loadLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const bulkUpdateCategories = async () => {
    if (!bulkCategory || selectedLeads.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedLeads).map((leadId) =>
          fetch(`/api/leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: bulkCategory }),
          })
        )
      );
      setSelectedLeads(new Set());
      setBulkCategory('');
      loadLeads();
    } catch (error) {
      console.error('Error bulk updating:', error);
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeads(newSelection);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !searchQuery ||
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === 'all' ||
      (filterCategory === 'uncategorized' && !lead.category) ||
      lead.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate category stats
  const categoryStats = PREDEFINED_CATEGORIES.map((cat) => ({
    ...cat,
    count: leads.filter((l) => l.category === cat.value).length,
  }));

  const uncategorizedCount = leads.filter((l) => !l.category).length;

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
        <h1 className="text-2xl font-bold text-gray-900">Lead Categories</h1>
        <p className="text-gray-600">Organize and filter leads by category</p>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilterCategory('all')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">All Leads</p>
              <p className="text-2xl font-bold">{leads.length}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilterCategory('uncategorized')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uncategorized</p>
              <p className="text-2xl font-bold">{uncategorizedCount}</p>
            </div>
            <Tag className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        {categoryStats.slice(0, 2).map((cat) => (
          <Card
            key={cat.value}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setFilterCategory(cat.value)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{cat.label}</p>
                <p className="text-2xl font-bold">{cat.count}</p>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${cat.color}`}>
                {cat.value}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* All Categories Grid */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">All Categories</h3>
        <div className="grid grid-cols-4 gap-2">
          {categoryStats.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                filterCategory === cat.value
                  ? cat.color
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedLeads.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="font-medium">
                {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
              </p>
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Set category..." />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={bulkUpdateCategories} disabled={!bulkCategory}>
                Apply to Selected
              </Button>
            </div>
            <Button variant="outline" onClick={() => setSelectedLeads(new Set())}>
              Clear Selection
            </Button>
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="uncategorized">Uncategorized</SelectItem>
            {PREDEFINED_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads List */}
      <div className="space-y-2">
        {filteredLeads.length === 0 ? (
          <Card className="p-12 text-center">
            <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No leads found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filterCategory !== 'all'
                ? `No leads in ${filterCategory} category`
                : 'Try adjusting your search'}
            </p>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedLeads.has(lead.id)}
                  onChange={() => toggleLeadSelection(lead.id)}
                  className="h-4 w-4"
                />

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {lead.first_name} {lead.last_name}
                    </Link>
                    {lead.category && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          PREDEFINED_CATEGORIES.find((c) => c.value === lead.category)?.color ||
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {PREDEFINED_CATEGORIES.find((c) => c.value === lead.category)?.label ||
                          lead.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {lead.email} • {lead.company}
                  </p>
                </div>

                <Select
                  value={lead.category || ''}
                  onValueChange={(value) => updateLeadCategory(lead.id, value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Set category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Link href={`/dashboard/leads/${lead.id}`}>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
