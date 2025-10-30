'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send } from 'lucide-react';

interface NewSMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: (phoneNumber: string) => void;
}

export function NewSMSModal({ isOpen, onClose, onSent }: NewSMSModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!phoneNumber.trim() || !message.trim() || sending) return;

    // Basic phone validation
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (!cleanPhone.startsWith('+') || cleanPhone.length < 10) {
      setError('Please enter a valid phone number with country code (e.g., +447700123456)');
      return;
    }

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanPhone,
          message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSent(cleanPhone);
        setPhoneNumber('');
        setMessage('');
        onClose();
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setMessage('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            New SMS Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Phone Number */}
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              type="tel"
              placeholder="+44 7700 123456"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={sending}
            />
            <p className="text-xs text-gray-500">
              Include country code (e.g., +44 for UK)
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
              disabled={sending}
            />
            <p className="text-xs text-gray-500">{message.length} / 160 characters</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1" disabled={sending}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!phoneNumber.trim() || !message.trim() || sending}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
