'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarStatus {
  connected: boolean;
  email?: string;
  calendarId?: string;
}

export function CalendarConnectButton() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('[CalendarConnectButton] Component mounted, checking status');
    checkStatus();

    // Check for OAuth callback params
    const calendarConnected = searchParams.get('calendar_connected');
    const calendarError = searchParams.get('calendar_error');

    console.log('[CalendarConnectButton] URL params:', { calendarConnected, calendarError });

    if (calendarConnected === 'true') {
      toast.success('Google Calendar connected successfully!');
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings');
      // Refresh status after a short delay
      setTimeout(() => {
        console.log('[CalendarConnectButton] Refreshing status after OAuth callback');
        checkStatus();
      }, 500);
    }

    if (calendarError) {
      toast.error('Failed to connect: ' + calendarError);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [searchParams]);

  const checkStatus = async () => {
    try {
      console.log('[CalendarConnectButton] Fetching calendar status...');
      const response = await fetch('/api/calendar/status');
      const data = await response.json();
      console.log('[CalendarConnectButton] Status response:', data);
      setStatus(data);
    } catch (error) {
      console.error('[CalendarConnectButton] Error checking calendar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);

    try {
      const response = await fetch('/api/calendar/connect');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect');
      }

      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error('Error connecting calendar:', error);
      toast.error(error.message || 'Failed to connect calendar');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Calendar?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success('Calendar disconnected');
      setStatus({ connected: false });
    } catch (error: any) {
      console.error('Error disconnecting calendar:', error);
      toast.error(error.message || 'Failed to disconnect calendar');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Button disabled variant="outline" className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking...
      </Button>
    );
  }

  if (status?.connected) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Connected to {status.email}</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          Disconnect Calendar
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={connecting} className="gap-2">
      {connecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Calendar className="h-4 w-4" />
      )}
      Connect Google Calendar
    </Button>
  );
}
