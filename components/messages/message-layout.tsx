'use client';

import { useState } from 'react';
import { ConversationSidebar } from './conversation-sidebar';
import { MessageFeed } from './message-feed';
import { NewDMModal } from './new-dm-modal';
import { toast } from 'sonner';

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
  const [showNewDMModal, setShowNewDMModal] = useState(false);

  const handleStartDMFromUser = async (userId: string, userName: string) => {
    try {
      // Create or get existing DM
      const response = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ other_user_id: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();

      // Switch to the DM conversation
      setSelectedConversation({
        id: data.conversation.id,
        type: 'dm',
        name: userName,
      });

      toast.success(`Started conversation with ${userName}`);
    } catch (error) {
      console.error('Error creating DM:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleDMCreated = (dmId: string, otherUser: any) => {
    // Switch to the newly created DM
    setSelectedConversation({
      id: dmId,
      type: 'dm',
      name: otherUser.full_name,
      avatar_url: otherUser.avatar_url,
    });
  };

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow overflow-hidden">
        {/* Sidebar */}
        <ConversationSidebar
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={setSelectedConversation}
          onNewDM={() => setShowNewDMModal(true)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <MessageFeed
              conversation={selectedConversation}
              onStartDM={handleStartDMFromUser}
            />
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

      {/* New DM Modal */}
      <NewDMModal
        open={showNewDMModal}
        onOpenChange={setShowNewDMModal}
        onDMCreated={handleDMCreated}
      />
    </>
  );
}
