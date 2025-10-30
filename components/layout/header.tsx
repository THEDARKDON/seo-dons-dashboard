'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/notification-bell';

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
            Here&apos;s what&apos;s happening with your sales today.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Quick Log Call
          </Button>

          <NotificationBell />

          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
