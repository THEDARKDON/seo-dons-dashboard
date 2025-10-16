'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export function SystemSettingsForm() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    autoRecordCalls: true,
    requireLeadApproval: false,
    enableNotifications: true,
    dailyCallLimit: 100,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real implementation, this would save to a system_settings table
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('System settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="autoRecordCalls">Auto Record Calls</Label>
            <p className="text-sm text-gray-400">
              Automatically record all outbound calls by default
            </p>
          </div>
          <Switch
            id="autoRecordCalls"
            checked={settings.autoRecordCalls}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, autoRecordCalls: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="requireLeadApproval">Require Lead Approval</Label>
            <p className="text-sm text-gray-400">
              Leads must be approved by a manager before calling
            </p>
          </div>
          <Switch
            id="requireLeadApproval"
            checked={settings.requireLeadApproval}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, requireLeadApproval: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enableNotifications">Enable Notifications</Label>
            <p className="text-sm text-gray-400">
              Send notifications for important events
            </p>
          </div>
          <Switch
            id="enableNotifications"
            checked={settings.enableNotifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enableNotifications: checked })
            }
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save System Settings'}
      </Button>
    </form>
  );
}
