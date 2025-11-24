'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Send, Search, Plus, Inbox, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ComposeEmailModal } from '@/components/email/compose-email-modal';

interface EmailMessage {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: string;
  created_at: string;
  is_read: boolean;
  gmail_thread_id?: string;
}

interface EmailThread {
  conversation_id: string;
  subject: string;
  latest_message: EmailMessage;
  unread_count: number;
  message_count: number;
}

export default function EmailPage() {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gmailConnected, setGmailConnected] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);

  // Check Gmail connection status
  useEffect(() => {
    checkGmailConnection();
  }, []);

  // Load conversations
  useEffect(() => {
    if (gmailConnected) {
      loadThreads();
      const interval = setInterval(loadThreads, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [gmailConnected]);

  // Load messages when thread selected
  useEffect(() => {
    if (selectedThread && gmailConnected) {
      loadMessages(selectedThread);
    }
  }, [selectedThread, gmailConnected]);

  const checkGmailConnection = async () => {
    try {
      const response = await fetch('/api/email/status');
      const data = await response.json();
      setGmailConnected(data.connected || false);
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
      setGmailConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadThreads = async () => {
    try {
      const response = await fetch('/api/email/conversations');
      const data = await response.json();
      if (data.threads) {
        setThreads(data.threads);
      }
    } catch (error) {
      console.error('Error loading email threads:', error);
    }
  };

  const loadMessages = async (threadId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/email/messages?thread=${encodeURIComponent(threadId)}`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const connectGmail = async () => {
    try {
      const response = await fetch('/api/email/connect');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
    }
  };

  const filteredThreads = threads.filter((thread) =>
    thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.conversation_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!gmailConnected) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Gmail</h2>
          <p className="text-gray-600 mb-6">
            Connect your Google Workspace email account to send and track emails from the CRM.
          </p>
          <Button onClick={connectGmail} size="lg" className="w-full">
            <Mail className="h-5 w-5 mr-2" />
            Connect Gmail Account
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email</h1>
          <p className="text-gray-600">Manage your email conversations</p>
        </div>
        <Button onClick={() => setShowComposeModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Compose
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100%-5rem)]">
        {/* Thread Sidebar */}
        <Card className="col-span-4 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No emails yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Sent emails will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.conversation_id}
                    onClick={() => setSelectedThread(thread.conversation_id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedThread === thread.conversation_id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">
                          {thread.conversation_id}
                        </span>
                      </div>
                      {thread.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                      {thread.subject || '(No subject)'}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {thread.latest_message.direction === 'outbound' ? 'You: ' : ''}
                      {thread.latest_message.body?.replace(/<[^>]*>/g, '').substring(0, 100) || '(No content)'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(thread.latest_message.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Email Thread View */}
        <Card className="col-span-8 flex flex-col">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Select an email</p>
                <p className="text-sm text-gray-400 mt-1">
                  Choose a conversation from the left to view emails
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Email Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      {messages[0]?.subject || '(No subject)'}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedThread}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No messages in this thread</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg border ${
                          msg.direction === 'outbound'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              {msg.direction === 'outbound' ? 'You' : msg.from_email}
                            </p>
                            <p className="text-xs text-gray-500">
                              To: {msg.to_email}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(msg.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div
                          className="text-sm prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: msg.body || '' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Quick Reply */}
              <div className="p-4 border-t">
                <Button variant="outline" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Reply
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Compose Email Modal */}
      <ComposeEmailModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onSent={() => {
          loadThreads();
          setShowComposeModal(false);
        }}
      />
    </div>
  );
}
