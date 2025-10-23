'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { MessageWithSender } from '@/lib/supabase/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserProfilePopover } from './user-profile-popover';

interface MessageBubbleProps {
  message: MessageWithSender;
  onDelete: (messageId: string) => void;
  onStartDM?: (userId: string) => void;
}

export function MessageBubble({ message, onDelete, onStartDM }: MessageBubbleProps) {
  const { user } = useUser();
  const [showActions, setShowActions] = useState(false);

  const isOwnMessage = user?.id === message.sender?.id;

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getSenderName = () => {
    if (!message.sender) return 'Unknown User';
    return `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() ||
           message.sender.email;
  };

  const getSenderInitials = () => {
    if (!message.sender) return '?';
    const firstName = message.sender.first_name || '';
    const lastName = message.sender.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  };

  return (
    <div
      className="group flex gap-3 hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar with Profile Popover */}
      <div className="flex-shrink-0">
        {message.sender && !isOwnMessage && onStartDM ? (
          <UserProfilePopover
            user={message.sender}
            onSendMessage={onStartDM}
          >
            <button className="cursor-pointer hover:opacity-80 transition-opacity">
              {message.sender?.avatar_url ? (
                <img
                  src={message.sender.avatar_url}
                  alt={getSenderName()}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {getSenderInitials()}
                </div>
              )}
            </button>
          </UserProfilePopover>
        ) : (
          <>
            {message.sender?.avatar_url ? (
              <img
                src={message.sender.avatar_url}
                alt={getSenderName()}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {getSenderInitials()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          {message.sender && !isOwnMessage && onStartDM ? (
            <UserProfilePopover
              user={message.sender}
              onSendMessage={onStartDM}
            >
              <button className="font-semibold text-sm hover:underline cursor-pointer">
                {getSenderName()}
              </button>
            </UserProfilePopover>
          ) : (
            <span className="font-semibold text-sm">{getSenderName()}</span>
          )}
          <span className="text-xs text-gray-500">
            {formatTime(message.created_at)}
          </span>
          {message.edited_at && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>

        <div className={cn(
          'text-sm mt-1 break-words',
          message.is_deleted && 'italic text-gray-400'
        )}>
          {message.content}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, idx) => (
              <div
                key={idx}
                className="border rounded p-2 text-sm text-blue-600 hover:bg-blue-50"
              >
                📎 {attachment.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && !message.is_deleted && (
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnMessage && (
                <DropdownMenuItem onClick={() => onDelete(message.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
