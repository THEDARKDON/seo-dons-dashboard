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
  const [smsGlobalEnabled, setSmsGlobalEnabled] = useState(true);
  const [emailGlobalEnabled, setEmailGlobalEnabled] = useState(true);
  const [updating, setUpdating] = useState(false);

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
      const smsAutoSendTemplates = smsData.templates?.filter((t: SMSTemplate) => t.auto_send_after_call) || [];
      const emailAutoSendTemplates = emailData.templates?.filter((t: EmailTemplate) => t.auto_send_after_call) || [];

      setSmsTemplates(smsAutoSendTemplates);
      setEmailTemplates(emailAutoSendTemplates);

      // Set global enabled states based on if any templates are active
      setSmsGlobalEnabled(smsAutoSendTemplates.some((t: SMSTemplate) => t.is_active));
      setEmailGlobalEnabled(emailAutoSendTemplates.some((t: EmailTemplate) => t.is_active));
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

  const toggleAllSMS = async (enabled: boolean) => {
    setUpdating(true);
    try {
      const promises = smsTemplates.map((template) =>
        fetch('/api/sms/templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...template,
            is_active: enabled,
          }),
        })
      );

      await Promise.all(promises);
      setSmsTemplates((prev) => prev.map((t) => ({ ...t, is_active: enabled })));
      setSmsGlobalEnabled(enabled);
    } catch (error) {
      console.error('Error updating all SMS templates:', error);
    } finally {
      setUpdating(false);
    }
  };

  const toggleAllEmails = async (enabled: boolean) => {
    setUpdating(true);
    try {
      const promises = emailTemplates.map((template) =>
        fetch('/api/email/templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...template,
            is_active: enabled,
          }),
        })
      );

      await Promise.all(promises);
      setEmailTemplates((prev) => prev.map((t) => ({ ...t, is_active: enabled })));
      setEmailGlobalEnabled(enabled);
    } catch (error) {
      console.error('Error updating all email templates:', error);
    } finally {
      setUpdating(false);
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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <CardTitle>SMS Auto-Send Templates</CardTitle>
              </div>
              <CardDescription>
                SMS messages automatically sent after calls based on call outcome
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {smsGlobalEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={smsGlobalEnabled}
                onCheckedChange={toggleAllSMS}
                disabled={updating || !globalEnabled}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!smsGlobalEnabled && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ SMS auto-send is currently disabled. Toggle the switch above to enable.
              </p>
            </div>
          )}
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
                      <span>Sends immediately after call</span>
                    </div>
                  </div>
                  <Switch
                    checked={template.is_active && globalEnabled && smsGlobalEnabled}
                    onCheckedChange={() => toggleSMSTemplate(template)}
                    disabled={!globalEnabled || !smsGlobalEnabled}
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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600" />
                <CardTitle>Email Auto-Send Templates</CardTitle>
              </div>
              <CardDescription>
                Emails automatically sent after calls based on call outcome
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {emailGlobalEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={emailGlobalEnabled}
                onCheckedChange={toggleAllEmails}
                disabled={updating || !globalEnabled}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!emailGlobalEnabled && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Email auto-send is currently disabled. Toggle the switch above to enable.
              </p>
            </div>
          )}
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
                    checked={template.is_active && globalEnabled && emailGlobalEnabled}
                    onCheckedChange={() => toggleEmailTemplate(template)}
                    disabled={!globalEnabled || !emailGlobalEnabled}
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
            <strong>Quick Controls:</strong> Use the toggles in the SMS and Email sections above to
            quickly enable/disable all auto-send messages for that type. Individual templates can
            also be toggled separately.
          </p>
          <p>
            <strong>Automatic Triggering:</strong> When a call completes, the system automatically
            sends enabled SMS and Email templates <strong>immediately</strong> to the contact.
          </p>
          <p>
            <strong>Call Requirements:</strong> The call must have a lead or customer associated
            with valid contact information (phone for SMS, email for Email).
          </p>
          <p>
            <strong>Personalization:</strong> Use variables like {'{first_name}'}, {'{last_name}'},
            {'{name}'}, and {'{company}'} in your templates for personalized messages.
          </p>
          <p>
            <strong>Template Categories:</strong> Templates marked as &quot;post_call&quot; will
            trigger after any completed call. Other categories can be used for organization.
          </p>
          <p>
            <strong>Edit Templates:</strong> Click &quot;Manage Templates&quot; above to edit message
            content and settings, or create new templates.
          </p>
          <div className="mt-3 p-3 bg-white border border-blue-300 rounded">
            <p className="font-semibold text-blue-900">📝 Note: Delays Removed</p>
            <p className="mt-1">The system now sends all messages immediately after calls (no delays).
            This ensures reliable delivery on the free tier without requiring cron jobs.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
