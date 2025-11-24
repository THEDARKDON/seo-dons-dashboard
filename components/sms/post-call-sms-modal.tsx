'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface PostCallSMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  contactName?: string;
  callId?: string;
  leadId?: string;
  customerId?: string;
}

export function PostCallSMSModal({
  isOpen,
  onClose,
  phoneNumber,
  contactName,
  callId,
  leadId,
  customerId,
}: PostCallSMSModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [message, setMessage] = useState('');
  const [sendDelay, setSendDelay] = useState<string>('0');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/sms/templates');
      const data = await response.json();
      if (data.templates) {
        // Filter active templates only
        const activeTemplates = data.templates.filter((t: Template) => t.category === 'post_call');
        setTemplates(activeTemplates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // Replace variables in template
      let content = template.content;
      if (contactName) {
        content = content.replace(/{name}/g, contactName);
        content = content.replace(/{first_name}/g, contactName.split(' ')[0]);
      }
      setMessage(content);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const delay = parseInt(sendDelay);

      if (delay > 0) {
        // Schedule SMS for later
        const response = await fetch('/api/sms/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phoneNumber,
            message,
            delayMinutes: delay,
            callId,
            leadId,
            customerId,
          }),
        });

        if (response.ok) {
          alert(`SMS scheduled to send in ${delay} minutes`);
          onClose();
        } else {
          alert('Failed to schedule SMS');
        }
      } else {
        // Send immediately
        const response = await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phoneNumber,
            message,
            callId,
            leadId,
            customerId,
          }),
        });

        if (response.ok) {
          alert('SMS sent successfully');
          onClose();
        } else {
          alert('Failed to send SMS');
        }
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const handleSkip = () => {
    setMessage('');
    setSelectedTemplate('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Follow-up SMS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contact Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Sending to:</p>
            <p className="font-medium">{contactName || phoneNumber}</p>
            <p className="text-sm text-gray-500">{phoneNumber}</p>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Choose Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template or write custom message" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            />
            <p className="text-xs text-gray-500">{message.length} / 160 characters</p>
          </div>

          {/* Send Delay */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Send Delay
            </Label>
            <Select value={sendDelay} onValueChange={setSendDelay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Send immediately</SelectItem>
                <SelectItem value="5">Send in 5 minutes</SelectItem>
                <SelectItem value="15">Send in 15 minutes</SelectItem>
                <SelectItem value="30">Send in 30 minutes</SelectItem>
                <SelectItem value="60">Send in 1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip
            </Button>
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendDelay !== '0' ? 'Schedule SMS' : 'Send Now'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
