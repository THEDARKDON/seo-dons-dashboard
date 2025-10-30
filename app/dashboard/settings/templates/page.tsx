'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Mail, Plus, Pencil, Trash2, Save } from 'lucide-react';

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  is_active: boolean;
  auto_send_after_call: boolean;
  auto_send_delay_minutes: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  is_active: boolean;
  auto_send_after_call: boolean;
}

export default function TemplatesPage() {
  const [smsTemplates, setSmsTemplates] = useState<SMSTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSMS, setEditingSMS] = useState<SMSTemplate | null>(null);
  const [editingEmail, setEditingEmail] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const [smsRes, emailRes] = await Promise.all([
        fetch('/api/sms/templates'),
        fetch('/api/email/templates'),
      ]);

      const smsData = await smsRes.json();
      const emailData = await emailRes.json();

      if (smsData.templates) setSmsTemplates(smsData.templates);
      if (emailData.templates) setEmailTemplates(emailData.templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSMSTemplate = async (template: SMSTemplate) => {
    try {
      const response = await fetch('/api/sms/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        await loadTemplates();
        setEditingSMS(null);
        alert('Template updated successfully');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template');
    }
  };

  const updateEmailTemplate = async (template: EmailTemplate) => {
    try {
      const response = await fetch('/api/email/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        await loadTemplates();
        setEditingEmail(null);
        alert('Template updated successfully');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
        <p className="text-gray-600">Manage SMS and Email templates for automated follow-ups</p>
      </div>

      {/* SMS Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS Templates
              </CardTitle>
              <CardDescription>
                Automated text message templates sent after calls
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">Loading templates...</p>
          ) : (
            <div className="space-y-4">
              {smsTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {editingSMS?.id === template.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Template Name</Label>
                        <Input
                          value={editingSMS.name}
                          onChange={(e) =>
                            setEditingSMS({ ...editingSMS, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={editingSMS.category}
                          onValueChange={(value) =>
                            setEditingSMS({ ...editingSMS, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="post_call_success">
                              After Successful Call
                            </SelectItem>
                            <SelectItem value="post_call_failed">
                              After Missed/Failed Call
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Message Content</Label>
                        <Textarea
                          value={editingSMS.content}
                          onChange={(e) =>
                            setEditingSMS({ ...editingSMS, content: e.target.value })
                          }
                          rows={4}
                          placeholder="Use {first_name}, {name}, {company} for personalization"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {editingSMS.content.length} / 160 characters
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingSMS.auto_send_after_call}
                            onChange={(e) =>
                              setEditingSMS({
                                ...editingSMS,
                                auto_send_after_call: e.target.checked,
                              })
                            }
                          />
                          <span className="text-sm">Auto-send after calls</span>
                        </label>
                        {editingSMS.auto_send_after_call && (
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Delay:</Label>
                            <Input
                              type="number"
                              value={editingSMS.auto_send_delay_minutes}
                              onChange={(e) =>
                                setEditingSMS({
                                  ...editingSMS,
                                  auto_send_delay_minutes: parseInt(e.target.value),
                                })
                              }
                              className="w-20"
                            />
                            <span className="text-sm">minutes</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => updateSMSTemplate(editingSMS)} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingSMS(null)}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{template.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {template.category.replace('_', ' ')}
                            </Badge>
                            {template.auto_send_after_call && (
                              <Badge className="text-xs bg-green-600">
                                Auto-send ({template.auto_send_delay_minutes}min)
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{template.content}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSMS(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Automated email templates sent after calls
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">Loading templates...</p>
          ) : (
            <div className="space-y-4">
              {emailTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {editingEmail?.id === template.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Template Name</Label>
                        <Input
                          value={editingEmail.name}
                          onChange={(e) =>
                            setEditingEmail({ ...editingEmail, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={editingEmail.category}
                          onValueChange={(value) =>
                            setEditingEmail({ ...editingEmail, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="post_call_success">
                              After Successful Call
                            </SelectItem>
                            <SelectItem value="post_call_failed">
                              After Missed/Failed Call
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Subject Line</Label>
                        <Input
                          value={editingEmail.subject}
                          onChange={(e) =>
                            setEditingEmail({ ...editingEmail, subject: e.target.value })
                          }
                          placeholder="Use {first_name}, {name}, {company} for personalization"
                        />
                      </div>
                      <div>
                        <Label>Email Body (HTML)</Label>
                        <Textarea
                          value={editingEmail.content}
                          onChange={(e) =>
                            setEditingEmail({ ...editingEmail, content: e.target.value })
                          }
                          rows={8}
                          placeholder="HTML content with personalization variables"
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingEmail.auto_send_after_call}
                          onChange={(e) =>
                            setEditingEmail({
                              ...editingEmail,
                              auto_send_after_call: e.target.checked,
                            })
                          }
                        />
                        <span className="text-sm">Auto-send after calls</span>
                      </label>
                      <div className="flex gap-2">
                        <Button onClick={() => updateEmailTemplate(editingEmail)} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingEmail(null)}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{template.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {template.category.replace('_', ' ')}
                            </Badge>
                            {template.auto_send_after_call && (
                              <Badge className="text-xs bg-green-600">Auto-send</Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-700 mt-1">
                            Subject: {template.subject}
                          </p>
                          <div
                            className="text-sm text-gray-600 mt-2 line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: template.content }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingEmail(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Personalization Variables</h4>
        <p className="text-sm text-blue-800 mb-2">
          You can use these variables in your templates:
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
          <div><code className="bg-blue-100 px-2 py-1 rounded">{'{first_name}'}</code> - Contact&apos;s first name</div>
          <div><code className="bg-blue-100 px-2 py-1 rounded">{'{name}'}</code> - Contact&apos;s full name</div>
          <div><code className="bg-blue-100 px-2 py-1 rounded">{'{company}'}</code> - Company name</div>
          <div><code className="bg-blue-100 px-2 py-1 rounded">{'{email}'}</code> - Contact&apos;s email</div>
        </div>
      </div>
    </div>
  );
}
