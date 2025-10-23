'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, User } from 'lucide-react';

interface UserProfilePopoverProps {
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
    role?: string;
  };
  children: React.ReactNode;
  onSendMessage?: (userId: string) => void;
}

export function UserProfilePopover({
  user,
  children,
  onSendMessage,
}: UserProfilePopoverProps) {
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
  const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase() || '?';

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'manager':
        return 'bg-blue-100 text-blue-700';
      case 'bdr':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {/* User Header */}
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={fullName}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-lg">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{fullName}</h3>
              {user.role && (
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t">
            {onSendMessage && (
              <Button
                variant="default"
                className="w-full justify-start"
                onClick={() => onSendMessage(user.id)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Direct Message
              </Button>
            )}
            <Button variant="outline" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
