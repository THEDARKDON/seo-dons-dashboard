'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageComposer } from './message-composer';
import { MessageBubble } from './message-bubble';
import { Button } from '@/components/ui/button';
import { Hash, MessageSquare, Users } from 'lucide-react';
import type { Conversation } from './message-layout';
import type { MessageWithSender } from '@/lib/supabase/types';

interface MessageFeedProps {
  conversation: Conversation;
}

export function MessageFeed({ conversation }: MessageFeedProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/messages/${conversation.id}?type=${conversation.type}&limit=50`
      );
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || sending) return;

    try {
      setSending(true);

      const payload = {
        content,
        channel_id: conversation.type === 'channel' ? conversation.id : null,
        dm_id: conversation.type === 'dm' ? conversation.id : null,
      };

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: '[Message deleted]', is_deleted: true }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b px-6 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          {conversation.type === 'channel' ? (
            <Hash className="h-5 w-5 text-gray-500" />
          ) : (
            <MessageSquare className="h-5 w-5 text-gray-500" />
          )}
          <div>
            <h3 className="font-semibold">{conversation.name}</h3>
            {conversation.description && (
              <p className="text-xs text-gray-500">{conversation.description}</p>
            )}
          </div>
        </div>
        {conversation.type === 'channel' && (
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Members
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No messages yet</p>
              <p className="text-sm text-gray-400">Be the first to send a message!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onDelete={handleDeleteMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="border-t bg-white">
        <MessageComposer
          onSend={handleSendMessage}
          disabled={sending}
          placeholder={`Message ${conversation.name}`}
        />
      </div>
    </div>
  );
}
