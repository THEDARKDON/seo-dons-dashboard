'use client';

import { useEffect, useState } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { toast } from 'sonner';
import { Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Global Voice Handler
 * Initializes Twilio Device in the background to receive incoming calls
 * Shows modal when incoming call arrives
 */
export function GlobalVoiceHandler() {
  const [device, setDevice] = useState<Device | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [callActive, setCallActive] = useState(false);

  useEffect(() => {
    initializeDevice();

    return () => {
      if (device) {
        device.destroy();
      }
    };
  }, []);

  const initializeDevice = async () => {
    try {
      const response = await fetch('/api/calling/token');
      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to get calling token:', data.error);
        return;
      }

      const twilioDevice = new Device(data.token, {
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        edge: ['dublin', 'london'],
      });

      twilioDevice.on('registered', () => {
        console.log('✅ Voice system ready - can receive calls');

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      });

      twilioDevice.on('error', (error) => {
        console.error('Twilio Device error:', error);
      });

      twilioDevice.on('incoming', (call) => {
        console.log('📞 Incoming call from:', call.parameters.From);
        setIncomingCall(call);
        setShowIncomingModal(true);

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Incoming Call', {
            body: `Call from ${call.parameters.From}`,
            requireInteraction: true,
          });
        }

        // Toast notification
        toast.info(`Incoming call from ${call.parameters.From}`, {
          duration: 30000,
        });

        // Setup call handlers
        call.on('accept', () => {
          console.log('✅ Call accepted');
          setCallActive(true);
        });

        call.on('disconnect', () => {
          console.log('📴 Call disconnected');
          setCallActive(false);
          setIncomingCall(null);
          setShowIncomingModal(false);
          toast.info('Call ended');
        });

        call.on('reject', () => {
          console.log('❌ Call rejected');
          setCallActive(false);
          setIncomingCall(null);
          setShowIncomingModal(false);
        });

        call.on('cancel', () => {
          console.log('🚫 Call cancelled');
          setCallActive(false);
          setIncomingCall(null);
          setShowIncomingModal(false);
          toast.info('Call cancelled by caller');
        });
      });

      await twilioDevice.register();
      setDevice(twilioDevice);
    } catch (error: any) {
      console.error('Error initializing voice system:', error);
    }
  };

  const answerCall = () => {
    if (incomingCall) {
      incomingCall.accept();
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      incomingCall.reject();
      setIncomingCall(null);
      setShowIncomingModal(false);
    }
  };

  const hangUp = () => {
    if (incomingCall) {
      incomingCall.disconnect();
      setIncomingCall(null);
      setShowIncomingModal(false);
      setCallActive(false);
    }
  };

  return (
    <>
      {/* Incoming Call Modal */}
      <Dialog open={showIncomingModal} onOpenChange={setShowIncomingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 animate-pulse text-blue-600" />
              Incoming Call
            </DialogTitle>
            <DialogDescription>
              {incomingCall?.parameters?.From || 'Unknown Number'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!callActive ? (
              // Answer/Reject buttons
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
                  onClick={rejectCall}
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  Reject
                </Button>
              </div>
            ) : (
              // Call active - show hang up button
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <p className="text-sm text-muted-foreground">Call Active</p>
                  <p className="text-lg font-medium text-green-700">Connected</p>
                </div>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={hangUp}
                  className="w-full"
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  Hang Up
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
