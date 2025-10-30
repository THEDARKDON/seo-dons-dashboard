'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Clock, CheckCircle2, XCircle, Settings } from 'lucide-react';

interface SMSTemplate {
  id: string;
  name: string;
  body: string;
  category: string;
  is_active: boolean;
  auto_send_after_call: boolean;
  auto_send_delay_minutes: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  category: string;
  is_active: boolean;
  auto_send_after_call: boolean;
}

export default function AutoSendPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [smsTemplates, setSmsTemplates] = useState<SMSTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [globalEnabled, setGlobalEnabled] = useState(true);

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

      // Filter only auto-send templates
      setSmsTemplates(
        smsData.templates?.filter((t: SMSTemplate) => t.auto_send_after_call) || []
      );
      setEmailTemplates(
        emailData.templates?.filter((t: EmailTemplate) => t.auto_send_after_call) || []
      );
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSMSTemplate = async (template: SMSTemplate) => {
    try {
      const response = await fetch('/api/sms/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          is_active: !template.is_active,
        }),
      });

      if (response.ok) {
        setSmsTemplates((prev) =>
          prev.map((t) => (t.id === template.id ? { ...t, is_active: !t.is_active } : t))
        );
      }
    } catch (error) {
      console.error('Error updating SMS template:', error);
    }
  };

  const toggleEmailTemplate = async (template: EmailTemplate) => {
    try {
      const response = await fetch('/api/email/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          is_active: !template.is_active,
        }),
      });

      if (response.ok) {
        setEmailTemplates((prev) =>
          prev.map((t) => (t.id === template.id ? { ...t, is_active: !t.is_active } : t))
        );
      }
    } catch (error) {
      console.error('Error updating email template:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auto-send settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auto Send Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure automatic SMS and Email messages sent after calls
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/settings/templates')}
          variant="outline"
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Templates
        </Button>
      </div>

      {/* Global Enable/Disable */}
      <Card>
        <CardHeader>
          <CardTitle>Global Auto-Send Control</CardTitle>
          <CardDescription>
            Master switch to enable or disable all automatic messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-Send Status</p>
              <p className="text-sm text-gray-600">
                {globalEnabled
                  ? 'Automatic messages are enabled'
                  : 'Automatic messages are disabled'}
              </p>
            </div>
            <Switch
              checked={globalEnabled}
              onCheckedChange={setGlobalEnabled}
            />
          </div>
          {!globalEnabled && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Auto-send is currently disabled. No automatic messages will be sent after calls.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SMS Auto-Send Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <CardTitle>SMS Auto-Send Templates</CardTitle>
          </div>
          <CardDescription>
            SMS messages automatically sent after calls based on call outcome
          </CardDescription>
        </CardHeader>
        <CardContent>
          {smsTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No SMS auto-send templates configured</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/dashboard/settings/templates')}
              >
                Create Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {smsTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {template.body}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Sent {template.auto_send_delay_minutes} minutes after call</span>
                    </div>
                  </div>
                  <Switch
                    checked={template.is_active && globalEnabled}
                    onCheckedChange={() => toggleSMSTemplate(template)}
                    disabled={!globalEnabled}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Auto-Send Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-600" />
            <CardTitle>Email Auto-Send Templates</CardTitle>
          </div>
          <CardDescription>
            Emails automatically sent after calls based on call outcome
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No email auto-send templates configured</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/dashboard/settings/templates')}
              >
                Create Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {emailTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{template.subject}</p>
                    <div className="text-sm text-gray-600 line-clamp-2">
                      <div dangerouslySetInnerHTML={{ __html: template.body_html }} />
                    </div>
                  </div>
                  <Switch
                    checked={template.is_active && globalEnabled}
                    onCheckedChange={() => toggleEmailTemplate(template)}
                    disabled={!globalEnabled}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">How Auto-Send Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Successful Calls:</strong> When a call is completed successfully, templates
            marked for successful calls will be automatically sent after their configured delay.
          </p>
          <p>
            <strong>Failed/Missed Calls:</strong> When a call is not answered or fails, templates
            marked for failed calls will be sent after their configured delay.
          </p>
          <p>
            <strong>Personalization:</strong> Use variables like {'{first_name}'}, {'{name}'}, and{' '}
            {'{company}'} in your templates to personalize messages.
          </p>
          <p>
            <strong>Edit Templates:</strong> Click &quot;Manage Templates&quot; above to edit message
            content, delays, and categories.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
