'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
      <div className="flex flex-1 items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Welcome back, {user?.firstName || 'User'}!
          </h2>
          <p className="text-sm text-muted-foreground">
            Here's what's happening with your sales today.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Quick Log Call
          </Button>

          <button className="relative rounded-full p-2 hover:bg-accent">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
