'use client';

import { useState, useEffect } from 'react';
import { PipelineBoard } from '@/components/pipeline/pipeline-board';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Deal {
  id: string;
  deal_name: string;
  deal_value: number;
  stage: string;
  stage_position: number;
  probability?: number;
  expected_close_date?: string;
  customers?: {
    id: string;
    first_name: string;
    last_name: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  users?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  nextAppointment?: {
    deal_id: string;
    scheduled_at: string;
    subject?: string;
  } | null;
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState<string>('all');

  useEffect(() => {
    loadUsers();
    loadDeals();
  }, [filterUser]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (data.users) {
        // Filter for BDRs, managers, and admins
        const dealUsers = data.users.filter((u: User) =>
          ['bdr', 'manager', 'admin'].includes(u.role)
        );
        setUsers(dealUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadDeals = async () => {
    try {
      let url = '/api/deals';
      const params = new URLSearchParams();

      if (filterUser !== 'all') {
        params.append('assignedTo', filterUser);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.deals) {
        setDeals(data.deals);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-gray-500">Loading pipeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground">Drag and drop deals to update their stage</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href="/dashboard/deals/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Deal
            </Button>
          </Link>
        </div>
      </div>

      <PipelineBoard initialDeals={deals} />
    </div>
  );
}
