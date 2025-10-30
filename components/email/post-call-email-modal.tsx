'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Send } from 'lucide-react';
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
  subject: string;
  content: string;
  category: string;
}

interface PostCallEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  toEmail: string;
  contactName?: string;
  callId?: string;
  leadId?: string;
  customerId?: string;
}

export function PostCallEmailModal({
  isOpen,
  onClose,
  toEmail,
  contactName,
  callId,
  leadId,
  customerId,
}: PostCallEmailModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/email/templates');
      const data = await response.json();
      if (data.templates) {
        // Filter post-call templates only
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
      let emailSubject = template.subject;
      let content = template.content;

      if (contactName) {
        emailSubject = emailSubject.replace(/{name}/g, contactName);
        content = content.replace(/{name}/g, contactName);
        content = content.replace(/{first_name}/g, contactName.split(' ')[0]);
      }

      setSubject(emailSubject);
      setMessage(content);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject,
          htmlBody: message.replace(/\n/g, '<br>'),
          textBody: message,
          callId,
          leadId,
          customerId,
        }),
      });

      if (response.ok) {
        alert('Email sent successfully');
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleSkip = () => {
    setSubject('');
    setMessage('');
    setSelectedTemplate('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Follow-up Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contact Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Sending to:</p>
            <p className="font-medium">{contactName || toEmail}</p>
            <p className="text-sm text-gray-500">{toEmail}</p>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Choose Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template or write custom email" />
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

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip
            </Button>
            <Button
              onClick={handleSend}
              disabled={!subject.trim() || !message.trim() || sending}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
