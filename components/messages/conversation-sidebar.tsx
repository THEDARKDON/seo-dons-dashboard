'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Hash, MessageSquare, Search, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from './message-layout';
import { formatDistanceToNow } from 'date-fns';

interface ConversationSidebarProps {
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onNewDM?: () => void;
  onRefresh?: () => void;
}

export function ConversationSidebar({
  selectedConversationId,
  onSelectConversation,
  onNewDM,
  onRefresh,
}: ConversationSidebarProps) {
  const [channels, setChannels] = useState<any[]>([]);
  const [directMessages, setDirectMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'channels' | 'dms'>('channels');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);

      // Load channels
      const channelsRes = await fetch('/api/channels');
      const channelsData = await channelsRes.json();
      setChannels(channelsData.channels || []);

      // Load DMs
      const dmsRes = await fetch('/api/direct-messages');
      const dmsData = await dmsRes.json();
      setDirectMessages(dmsData.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = (conversations: any[], type: 'channel' | 'dm') => {
    if (!searchQuery) return conversations;

    return conversations.filter((conv) => {
      if (type === 'channel') {
        return conv.name?.toLowerCase().includes(searchQuery.toLowerCase());
      } else {
        const otherParticipant = conv.other_participant;
        const fullName = `${otherParticipant?.first_name} ${otherParticipant?.last_name}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase()) ||
               otherParticipant?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      }
    });
  };

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getConversationName = (conv: any, type: 'channel' | 'dm') => {
    if (type === 'channel') {
      return conv.name;
    } else {
      const other = conv.other_participant;
      return other ? `${other.first_name} ${other.last_name}` : 'Unknown User';
    }
  };

  const renderConversationItem = (conv: any, type: 'channel' | 'dm') => {
    const isSelected = selectedConversationId === conv.id;
    const name = getConversationName(conv, type);
    const hasUnread = (conv.unread_count || 0) > 0;

    return (
      <button
        key={conv.id}
        onClick={() =>
          onSelectConversation({
            id: conv.id,
            type,
            name,
            description: conv.description,
            avatar_url: conv.other_participant?.avatar_url,
            unread_count: conv.unread_count,
            last_message: conv.last_message,
            last_message_at: conv.last_message_at,
          })
        }
        className={cn(
          'w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors',
          isSelected && 'bg-blue-50 hover:bg-blue-100'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {type === 'channel' ? (
              <Hash className="h-4 w-4 text-gray-500 flex-shrink-0" />
            ) : (
              <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
            )}
            <span className={cn('text-sm truncate', hasUnread && 'font-semibold')}>
              {name}
            </span>
          </div>
          {hasUnread && (
            <Badge variant="default" className="ml-2 flex-shrink-0">
              {conv.unread_count}
            </Badge>
          )}
        </div>
        {conv.last_message && (
          <div className="ml-6 mt-1">
            <p className="text-xs text-gray-500 truncate">
              {conv.last_message.sender?.first_name}: {conv.last_message.content}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatLastMessageTime(conv.last_message.created_at)}
            </p>
          </div>
        )}
      </button>
    );
  };

  const filteredChannels = filterConversations(channels, 'channel');
  const filteredDMs = filterConversations(directMessages, 'dm');

  return (
    <div className="w-80 border-r flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Messages</h2>
          <div className="flex gap-2">
            {activeTab === 'dms' && onNewDM && (
              <Button size="sm" variant="default" onClick={onNewDM} title="New Direct Message">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('channels')}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'channels'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <Hash className="h-4 w-4" />
            Channels ({channels.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('dms')}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'dms'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Direct ({directMessages.length})
          </div>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {loading ? (
          <div className="text-center text-sm text-gray-500 py-8">Loading...</div>
        ) : activeTab === 'channels' ? (
          filteredChannels.length > 0 ? (
            filteredChannels.map((channel) => renderConversationItem(channel, 'channel'))
          ) : (
            <div className="text-center text-sm text-gray-500 py-8">No channels found</div>
          )
        ) : filteredDMs.length > 0 ? (
          filteredDMs.map((dm) => renderConversationItem(dm, 'dm'))
        ) : (
          <div className="text-center text-sm text-gray-500 py-8">
            No direct messages yet
          </div>
        )}
      </div>
    </div>
  );
}
