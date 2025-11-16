'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ACTIVE_STAGES } from '@/lib/constants/pipeline-stages';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  owned_by: string;
  deals: Array<{
    id: string;
    deal_name: string;
    deal_value: number;
    stage: string;
  }>;
}

interface CustomerWithStats extends Customer {
  totalDeals: number;
  activeDeals: number;
  totalValue: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState<string>('all');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    loadCurrentUserRole();
    loadUsers();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [filterUser]);

  const loadCurrentUserRole = async () => {
    try {
      const response = await fetch('/api/user/role');
      const data = await response.json();
      if (data.role) {
        setCurrentUserRole(data.role);
      }
    } catch (error) {
      console.error('Error loading current user role:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (data.users) {
        const sdrUsers = data.users.filter((u: User) =>
          ['bdr', 'manager', 'admin'].includes(u.role)
        );
        setUsers(sdrUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      let url = '/api/customers';
      const params = new URLSearchParams();

      if (filterUser !== 'all') {
        params.append('ownedBy', filterUser);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.customers) {
        const customersWithStats = data.customers.map((customer: Customer) => {
          const deals = customer.deals || [];
          const totalDeals = deals.length;
          const activeDeals = deals.filter((d) => ACTIVE_STAGES.includes(d.stage)).length;
          const totalValue = deals.reduce((sum, d) => sum + Number(d.deal_value || 0), 0);

          return {
            ...customer,
            totalDeals,
            activeDeals,
            totalValue,
          };
        });

        setCustomers(customersWithStats);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-gray-500">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <div className="flex gap-2">
          {(currentUserRole === 'admin' || currentUserRole === 'manager') && users.length > 0 && (
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by SDR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SDRs</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Link href="/dashboard/customers/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Phone</th>
                  <th className="pb-3 font-medium">Deals</th>
                  <th className="pb-3 font-medium">Total Value</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No customers found. Create your first customer to get started.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-4">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="font-medium hover:underline"
                        >
                          {customer.first_name} {customer.last_name}
                        </Link>
                      </td>
                      <td className="py-4">{customer.company || '-'}</td>
                      <td className="py-4">{customer.email || '-'}</td>
                      <td className="py-4">{customer.phone || '-'}</td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">
                            {customer.totalDeals} total
                          </span>
                          {customer.activeDeals > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {customer.activeDeals} active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        ${customer.totalValue.toLocaleString()}
                      </td>
                      <td className="py-4">
                        <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                          {customer.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {formatDate(customer.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
