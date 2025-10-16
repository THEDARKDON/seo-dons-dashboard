'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

interface CallInterfaceProps {
  phoneNumber: string;
  customerName?: string;
  customerId?: string;
  dealId?: string;
  onEnd?: () => void;
}

export function CallInterface({
  phoneNumber,
  customerName,
  customerId,
  dealId,
  onEnd,
}: CallInterfaceProps) {
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [callSid, setCallSid] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initiate call
    initiateCall();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  const initiateCall = async () => {
    try {
      const response = await fetch('/api/calling/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toNumber: phoneNumber,
          customerId,
          dealId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to make call');
      }

      setCallSid(data.callSid);
      setCallStatus('ringing');

      // Simulate call progression (in production, use SignalWire events)
      setTimeout(() => {
        setCallStatus('connected');
      }, 3000);
    } catch (error: any) {
      console.error('Error initiating call:', error);
      toast.error(error.message || 'Failed to initiate call');
      setCallStatus('ended');
    }
  };

  const handleEndCall = async () => {
    setCallStatus('ended');

    if (callSid) {
      // End call via API (we'll implement this)
      try {
        await fetch('/api/calling/end-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callSid }),
        });
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }

    if (onEnd) {
      onEnd();
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    // In production, control actual audio stream
  };

  const toggleSpeaker = () => {
    setSpeakerOn(!speakerOn);
    // In production, control audio output
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting':
        return 'secondary';
      case 'ringing':
        return 'default';
      case 'connected':
        return 'success';
      case 'ended':
        return 'destructive';
    }
  };

  const getStatusLabel = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return 'Connected';
      case 'ended':
        return 'Call Ended';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {customerName || phoneNumber}
        </CardTitle>
        {customerName && (
          <p className="text-sm text-muted-foreground">{phoneNumber}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant={getStatusColor() as any} className="text-sm px-3 py-1">
            {getStatusLabel()}
          </Badge>
          <div className="text-3xl font-bold text-muted-foreground">
            {formatDuration(duration)}
          </div>
        </div>

        {callStatus !== 'ended' && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={muted ? 'destructive' : 'outline'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleMute}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              className="h-16 w-16 rounded-full"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>

            <Button
              variant={!speakerOn ? 'destructive' : 'outline'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleSpeaker}
            >
              {speakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
        )}

        {callStatus === 'ended' && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Call duration: {formatDuration(duration)}
            </p>
            <Button variant="outline" onClick={onEnd} className="w-full">
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
