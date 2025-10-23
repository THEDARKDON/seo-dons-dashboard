'use client';

import { useState } from 'react';
import { ConversationSidebar } from './conversation-sidebar';
import { MessageFeed } from './message-feed';

export interface Conversation {
  id: string;
  type: 'channel' | 'dm';
  name: string;
  description?: string;
  avatar_url?: string;
  unread_count?: number;
  last_message?: any;
  last_message_at?: string;
}

export function MessageLayout() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow overflow-hidden">
      {/* Sidebar */}
      <ConversationSidebar
        selectedConversationId={selectedConversation?.id}
        onSelectConversation={setSelectedConversation}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <MessageFeed conversation={selectedConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
              <p className="text-sm">Choose a channel or direct message to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
