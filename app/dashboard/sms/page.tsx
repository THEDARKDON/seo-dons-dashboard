'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Search, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  from_number: string;
  to_number: string;
  direction: 'inbound' | 'outbound';
  body: string;
  status: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  conversation_id: string;
  latest_message: Message;
  unread_count: number;
  message_count: number;
}

export default function SMSPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load conversations
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/sms/conversations');
      const data = await response.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/sms/messages?conversation=${conversationId}`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedConversation,
          message: messageText,
        }),
      });

      if (response.ok) {
        setMessageText('');
        await loadMessages(selectedConversation);
        await loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Format +447700158258 to +44 7700 158258
    if (phone.startsWith('+44')) {
      return `+44 ${phone.slice(3, 7)} ${phone.slice(7)}`;
    }
    return phone;
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.conversation_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.latest_message.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SMS Messages</h1>
        <p className="text-gray-600">Manage your text message conversations</p>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100%-5rem)]">
        {/* Conversation Sidebar */}
        <Card className="col-span-4 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No conversations yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start a conversation by calling a lead
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => setSelectedConversation(conv.conversation_id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedConversation === conv.conversation_id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-sm">
                          {formatPhoneNumber(conv.conversation_id)}
                        </span>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conv.latest_message.direction === 'outbound' ? 'You: ' : ''}
                      {conv.latest_message.body}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(conv.latest_message.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Message Thread */}
        <Card className="col-span-8 flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Select a conversation</p>
                <p className="text-sm text-gray-400 mt-1">
                  Choose a conversation from the left to view messages
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Message Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">
                    {formatPhoneNumber(selectedConversation)}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.direction === 'outbound'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p
                            className={`text-xs ${
                              msg.direction === 'outbound'
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {formatDistanceToNow(new Date(msg.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                          {msg.direction === 'outbound' && (
                            <span
                              className={`text-xs ${
                                msg.status === 'delivered'
                                  ? 'text-blue-100'
                                  : 'text-blue-200'
                              }`}
                            >
                              {msg.status === 'delivered' ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Composer */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button onClick={sendMessage} disabled={sending || !messageText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
