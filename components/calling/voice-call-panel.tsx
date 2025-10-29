'use client';

import { useState, useEffect, useRef } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneForwarded,
  Pause,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';

interface VoiceCallPanelProps {
  leadId?: string;
  customerId?: string;
  dealId?: string;
  phoneNumber?: string;
}

export function VoiceCallPanel({ leadId, customerId, dealId, phoneNumber }: VoiceCallPanelProps) {
  const [device, setDevice] = useState<Device | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'ringing' | 'active' | 'disconnecting'>('idle');
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [dialNumber, setDialNumber] = useState(phoneNumber || '');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Twilio Device
  useEffect(() => {
    initializeDevice();

    return () => {
      if (device) {
        device.destroy();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const initializeDevice = async () => {
    try {
      const response = await fetch('/api/calling/token');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get token');
      }

      const twilioDevice = new Device(data.token, {
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        edge: ['dublin', 'london'], // Use EU edges for UK
      });

      twilioDevice.on('registered', () => {
        console.log('Twilio Device registered');
        toast.success('Voice system ready');

        // Request notification permission for incoming calls
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      });

      twilioDevice.on('error', (error) => {
        console.error('Twilio Device error:', error);
        toast.error(`Voice error: ${error.message}`);
      });

      twilioDevice.on('incoming', (incomingCall) => {
        console.log('Incoming call from:', incomingCall.parameters.From);
        setCall(incomingCall);
        setStatus('ringing');
        setupCallHandlers(incomingCall);

        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Incoming Call', {
            body: `Call from ${incomingCall.parameters.From}`,
            icon: '/phone-icon.png',
            requireInteraction: true,
          });
        }

        // Show toast notification
        toast.info(`Incoming call from ${incomingCall.parameters.From}`, {
          duration: 30000, // 30 seconds
        });
      });

      await twilioDevice.register();
      setDevice(twilioDevice);
    } catch (error: any) {
      console.error('Error initializing device:', error);
      toast.error(`Failed to initialize calling: ${error.message}`);
    }
  };

  const setupCallHandlers = (activeCall: Call) => {
    activeCall.on('accept', () => {
      console.log('Call accepted');
      setStatus('active');
      startCallTimer();
    });

    activeCall.on('disconnect', async () => {
      console.log('Call disconnected');
      const finalDuration = callDuration;

      setStatus('idle');
      setCall(null);
      stopCallTimer();

      // Save call to database
      if (activeCall.parameters.CallSid && finalDuration > 0) {
        try {
          await fetch('/api/calling/save-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callSid: activeCall.parameters.CallSid,
              toNumber: dialNumber,
              leadId,
              customerId,
              dealId,
              duration: finalDuration,
            }),
          });
          toast.success('Call saved to history');
        } catch (error) {
          console.error('Failed to save call:', error);
        }
      }
    });

    activeCall.on('cancel', () => {
      console.log('Call cancelled');
      setStatus('idle');
      setCall(null);
    });

    activeCall.on('reject', () => {
      console.log('Call rejected');
      setStatus('idle');
      setCall(null);
    });
  };

  const startCallTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDuration(0);
  };

  const makeCall = async () => {
    if (!device || !dialNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      setStatus('connecting');

      const params: any = {
        To: dialNumber,
      };

      if (leadId) params.leadId = leadId;
      if (customerId) params.customerId = customerId;
      if (dealId) params.dealId = dealId;

      const outgoingCall = await device.connect({ params });
      setCall(outgoingCall);
      setupCallHandlers(outgoingCall);

      toast.success('Calling...');
    } catch (error: any) {
      console.error('Error making call:', error);
      toast.error(`Failed to make call: ${error.message}`);
      setStatus('idle');
    }
  };

  const hangUp = () => {
    if (call) {
      setStatus('disconnecting');
      call.disconnect();
    }
  };

  const answerCall = () => {
    if (call && status === 'ringing') {
      call.accept();
    }
  };

  const toggleMute = () => {
    if (call) {
      call.mute(!muted);
      setMuted(!muted);
    }
  };

  const toggleHold = () => {
    if (call) {
      // Twilio doesn't have native hold, so we mute both sides
      // In production, you'd want server-side hold with music
      call.mute(!onHold);
      setOnHold(!onHold);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connecting':
        return <Badge variant="outline" className="animate-pulse">Connecting...</Badge>;
      case 'ringing':
        return <Badge variant="outline" className="animate-pulse">Ringing...</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Active - {formatDuration(callDuration)}</Badge>;
      case 'disconnecting':
        return <Badge variant="outline">Disconnecting...</Badge>;
      default:
        return <Badge variant="secondary">Ready</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Voice Call</CardTitle>
            <CardDescription>Make and receive calls directly in your browser</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dial Pad */}
        {status === 'idle' && (
          <div className="space-y-2">
            <Input
              type="tel"
              placeholder="+44 7700 123456"
              value={dialNumber}
              onChange={(e) => setDialNumber(e.target.value)}
              className="text-lg"
            />
            <Button
              onClick={makeCall}
              disabled={!dialNumber || !device}
              className="w-full"
              size="lg"
            >
              <Phone className="mr-2 h-5 w-5" />
              Call
            </Button>
          </div>
        )}

        {/* Incoming Call - Answer/Reject */}
        {status === 'ringing' && (
          <div className="space-y-4">
            <div className="text-center p-6 bg-blue-50 border-2 border-blue-200 rounded-lg animate-pulse">
              <Phone className="h-12 w-12 mx-auto mb-3 text-blue-600" />
              <p className="text-sm text-muted-foreground">Incoming Call</p>
              <p className="text-2xl font-semibold">{call?.parameters?.From || 'Unknown'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={answerCall}
              >
                <Phone className="h-5 w-5 mr-2" />
                Answer
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={hangUp}
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Active Call Controls */}
        {(status === 'active' || status === 'connecting') && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Call Active</p>
              <p className="text-2xl font-semibold">{call?.parameters?.From || dialNumber}</p>
              {status === 'active' && (
                <p className="text-lg text-muted-foreground mt-2">{formatDuration(callDuration)}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={muted ? 'destructive' : 'outline'}
                onClick={toggleMute}
                disabled={status !== 'active'}
              >
                {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                <span className="ml-2 text-xs">{muted ? 'Unmute' : 'Mute'}</span>
              </Button>

              <Button
                variant={onHold ? 'destructive' : 'outline'}
                onClick={toggleHold}
                disabled={status !== 'active'}
              >
                {onHold ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                <span className="ml-2 text-xs">{onHold ? 'Resume' : 'Hold'}</span>
              </Button>

              <Button
                variant="destructive"
                onClick={hangUp}
                className="col-span-1"
              >
                <PhoneOff className="h-5 w-5" />
                <span className="ml-2 text-xs">Hang Up</span>
              </Button>
            </div>
          </div>
        )}

        {/* Disconnecting State */}
        {status === 'disconnecting' && (
          <div className="text-center p-8">
            <p className="text-muted-foreground">Disconnecting...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
