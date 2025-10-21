'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Device, Call } from '@twilio/voice-sdk';
import { CalendarBookingModal } from '@/components/calendar/calendar-booking-modal';

interface CallInterfaceProps {
  phoneNumber: string;
  customerName?: string;
  customerId?: string;
  dealId?: string;
  leadId?: string;
  customerEmail?: string;
  onEnd?: () => void;
}

export function CallInterface({
  phoneNumber,
  customerName,
  customerId,
  dealId,
  leadId,
  customerEmail,
  onEnd,
}: CallInterfaceProps) {
  console.log('[CallInterface] Props:', { phoneNumber, customerName, customerEmail, leadId });

  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [callRecordId, setCallRecordId] = useState<string | null>(null);

  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize Twilio Device and make call
    initializeDevice();

    return () => {
      // Cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (callRef.current) {
        callRef.current.disconnect();
      }
      if (deviceRef.current) {
        deviceRef.current.destroy();
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

  const initializeDevice = async () => {
    try {
      // Request microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted');
      } catch (mediaError: any) {
        console.error('Microphone permission error:', mediaError);
        toast.error('Microphone access denied. Please allow microphone access in your browser.');
        setCallStatus('ended');
        return;
      }

      // Get access token
      const response = await fetch('/api/calling/token');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get access token');
      }

      // Create Twilio Device with IE1 region configuration
      const device = new Device(data.token, {
        logLevel: 1,
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        edge: 'dublin', // Use Dublin (Ireland) edge location
        // Explicitly set audio constraints for better compatibility
        enableImprovedSignalingErrorPrecision: true,
      });

      deviceRef.current = device;

      // Setup device event listeners
      device.on('registered', () => {
        console.log('Twilio Device registered');
      });

      device.on('error', (error) => {
        console.error('Twilio Device error:', error);
        toast.error('Device error: ' + error.message);
        setCallStatus('ended');
      });

      // Register the device
      await device.register();

      // Make the call
      makeCall(device, data.phoneNumber);
    } catch (error: any) {
      console.error('Error initializing device:', error);
      toast.error(error.message || 'Failed to initialize calling');
      setCallStatus('ended');
    }
  };

  const makeCall = async (device: Device, callerIdNumber: string) => {
    try {
      setCallStatus('ringing');

      // Make outbound call with parameters
      const call = await device.connect({
        params: {
          To: phoneNumber,
          CallerId: callerIdNumber,
        },
      });

      callRef.current = call;

      // Setup call event listeners
      call.on('accept', () => {
        console.log('Call accepted');
        setCallStatus('connected');
        toast.success('Call connected');

        // Save call record to database
        saveCallRecord(call.parameters.CallSid);
      });

      call.on('disconnect', () => {
        console.log('Call disconnected');
        setCallStatus('ended');
      });

      call.on('cancel', () => {
        console.log('Call canceled');
        setCallStatus('ended');
      });

      call.on('reject', () => {
        console.log('Call rejected');
        toast.error('Call was rejected');
        setCallStatus('ended');
      });

      call.on('error', (error) => {
        console.error('Call error:', error);
        toast.error('Call error: ' + error.message);
        setCallStatus('ended');
      });
    } catch (error: any) {
      console.error('Error making call:', error);
      toast.error(error.message || 'Failed to make call');
      setCallStatus('ended');
    }
  };

  const saveCallRecord = async (callSid: string) => {
    try {
      const response = await fetch('/api/calling/save-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callSid,
          toNumber: phoneNumber,
          customerId,
          dealId,
          leadId,
        }),
      });

      const data = await response.json();
      if (data.callId) {
        setCallRecordId(data.callId);
      }
    } catch (error) {
      console.error('Error saving call record:', error);
    }
  };

  const handleEndCall = () => {
    if (callRef.current) {
      callRef.current.disconnect();
    }
    setCallStatus('ended');
    // Don't call onEnd() here - let user see the booking button
    // onEnd() will be called when user clicks "Close" button
  };

  const toggleMute = () => {
    if (callRef.current) {
      if (muted) {
        callRef.current.mute(false);
      } else {
        callRef.current.mute(true);
      }
      setMuted(!muted);
    }
  };

  const toggleSpeaker = () => {
    // Note: Speaker control depends on browser capabilities
    // This is a placeholder for future implementation
    setSpeakerOn(!speakerOn);
    toast.info('Speaker control not yet implemented');
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
        return 'Initializing...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return 'Connected';
      case 'ended':
        return 'Call Ended';
    }
  };

  return (
    <>
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
              disabled={callStatus !== 'connected'}
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
              disabled={callStatus !== 'connected'}
            >
              {speakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
        )}

        {callStatus === 'ended' && (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Call duration: {formatDuration(duration)}
            </p>

            {customerEmail ? (
              <Button
                variant="default"
                onClick={() => {
                  console.log('[CallInterface] Opening booking modal for:', customerEmail);
                  setShowBookingModal(true);
                }}
                className="w-full gap-2"
              >
                <Calendar className="h-4 w-4" />
                Book Follow-up Meeting
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                No email available for this contact
              </p>
            )}

            <Button variant="outline" onClick={onEnd} className="w-full">
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

      {/* Calendar Booking Modal */}
      {customerEmail && (
        <CalendarBookingModal
          open={showBookingModal}
          onOpenChange={setShowBookingModal}
          customerEmail={customerEmail}
          customerName={customerName}
          customerId={customerId}
          dealId={dealId}
          leadId={leadId}
          callRecordId={callRecordId || undefined}
          phoneNumber={phoneNumber}
        />
      )}
    </>
  );
}
