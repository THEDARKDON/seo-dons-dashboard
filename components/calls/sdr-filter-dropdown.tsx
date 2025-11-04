'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface SdrFilterDropdownProps {
  users: User[];
  currentFilter?: string;
}

export function SdrFilterDropdown({ users, currentFilter }: SdrFilterDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (userId: string | null) => {
    const params = new URLSearchParams(searchParams);

    if (userId) {
      params.set('sdr', userId);
    } else {
      params.delete('sdr');
    }

    router.push(`/dashboard/calls/history?${params.toString()}`);
  };

  const currentUser = users.find(u => u.id === currentFilter);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          {currentUser ? (
            <>
              {currentUser.first_name} {currentUser.last_name}
              <X
                className="h-3 w-3 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange(null);
                }}
              />
            </>
          ) : (
            'Filter by SDR'
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter by SDR</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleFilterChange(null)}
          className={!currentFilter ? 'bg-accent' : ''}
        >
          All SDRs
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {users.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => handleFilterChange(user.id)}
            className={currentFilter === user.id ? 'bg-accent' : ''}
          >
            {user.first_name} {user.last_name}
            <span className="ml-auto text-xs text-muted-foreground">
              {user.role}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
