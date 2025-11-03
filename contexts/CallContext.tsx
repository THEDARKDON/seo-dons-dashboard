'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { toast } from 'sonner';

interface CallState {
  status: 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended';
  duration: number;
  phoneNumber?: string;
  customerName?: string;
  customerId?: string;
  dealId?: string;
  leadId?: string;
  customerEmail?: string;
  callRecordId?: string;
  muted: boolean;
}

interface CallContextType {
  callState: CallState;
  device: Device | null;
  activeCall: Call | null;
  initiateCall: (params: {
    phoneNumber: string;
    customerName?: string;
    customerId?: string;
    dealId?: string;
    leadId?: string;
    customerEmail?: string;
  }) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  sendDTMF: (digit: string) => void;
  minimized: boolean;
  setMinimized: (minimized: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    duration: 0,
    muted: false,
  });
  const [minimized, setMinimized] = useState(false);

  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize device on mount to handle incoming calls
  useEffect(() => {
    // Initialize device in background for incoming calls
    initializeDevice().catch((error) => {
      console.error('[CallContext] Failed to initialize device on mount:', error);
      // Don't show error toast on mount - user hasn't interacted yet
    });
  }, []);

  // Start duration timer when call connects
  useEffect(() => {
    if (callState.status === 'connected') {
      timerRef.current = setInterval(() => {
        setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
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
  }, [callState.status]);

  const initializeDevice = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get access token
      const response = await fetch('/api/calling/token');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get access token');
      }

      // Create Twilio Device
      const device = new Device(data.token, {
        logLevel: 1,
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        edge: 'dublin',
        enableImprovedSignalingErrorPrecision: true,
      });

      deviceRef.current = device;

      // Setup device event listeners
      device.on('registered', () => {
        console.log('[CallContext] Twilio Device registered - ready for calls');

        // Request notification permission for incoming calls
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      });

      device.on('error', (error) => {
        console.error('[CallContext] Twilio Device error:', error);
        toast.error('Device error: ' + error.message);
        setCallState((prev) => ({ ...prev, status: 'ended' }));
      });

      // Handle incoming calls
      device.on('incoming', (call) => {
        console.log('[CallContext] Incoming call from:', call.parameters.From);

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Incoming Call', {
            body: `Call from ${call.parameters.From}`,
            requireInteraction: true,
          });
        }

        // Toast notification with action
        toast.info(`Incoming call from ${call.parameters.From}`, {
          duration: 30000,
          action: {
            label: 'Answer',
            onClick: () => {
              call.accept();
              callRef.current = call;
              setCallState({
                status: 'connected',
                duration: 0,
                phoneNumber: call.parameters.From,
                customerName: undefined,
                muted: false,
              });
              setMinimized(false);
            },
          },
        });

        // Setup incoming call handlers
        call.on('accept', () => {
          console.log('[CallContext] Incoming call accepted');
          callRef.current = call;
          setCallState({
            status: 'connected',
            duration: 0,
            phoneNumber: call.parameters.From,
            customerName: undefined,
            muted: false,
          });
          setMinimized(false);
          saveCallRecord(call.parameters.CallSid);
        });

        call.on('disconnect', () => {
          console.log('[CallContext] Incoming call disconnected');
          setCallState((prev) => ({ ...prev, status: 'ended' }));
          callRef.current = null;
          toast.info('Call ended');
        });

        call.on('reject', () => {
          console.log('[CallContext] Incoming call rejected');
          callRef.current = null;
          toast.info('Call rejected');
        });

        call.on('cancel', () => {
          console.log('[CallContext] Incoming call cancelled');
          callRef.current = null;
          toast.info('Call cancelled by caller');
        });
      });

      // Register the device
      await device.register();

      return { device, phoneNumber: data.phoneNumber };
    } catch (error: any) {
      console.error('[CallContext] Error initializing device:', error);
      toast.error(error.message || 'Failed to initialize calling');
      throw error;
    }
  };

  const makeCall = async (device: Device, callerIdNumber: string, phoneNumber: string) => {
    try {
      setCallState((prev) => ({ ...prev, status: 'ringing' }));

      // Make outbound call
      const call = await device.connect({
        params: {
          To: phoneNumber,
          CallerId: callerIdNumber,
        },
      });

      callRef.current = call;

      // Setup call event listeners
      call.on('accept', () => {
        console.log('[CallContext] Call accepted');
        setCallState((prev) => ({ ...prev, status: 'connected' }));
        toast.success('Call connected');
        saveCallRecord(call.parameters.CallSid);
      });

      call.on('disconnect', () => {
        console.log('[CallContext] Call disconnected');
        setCallState((prev) => ({ ...prev, status: 'ended' }));
        callRef.current = null;
      });

      call.on('cancel', () => {
        console.log('[CallContext] Call canceled');
        setCallState((prev) => ({ ...prev, status: 'ended' }));
        callRef.current = null;
      });

      call.on('reject', () => {
        console.log('[CallContext] Call rejected');
        toast.error('Call was rejected');
        setCallState((prev) => ({ ...prev, status: 'ended' }));
        callRef.current = null;
      });

      call.on('error', (error) => {
        console.error('[CallContext] Call error:', error);
        toast.error('Call error: ' + error.message);
        setCallState((prev) => ({ ...prev, status: 'ended' }));
        callRef.current = null;
      });
    } catch (error: any) {
      console.error('[CallContext] Error making call:', error);
      toast.error(error.message || 'Failed to make call');
      setCallState((prev) => ({ ...prev, status: 'ended' }));
    }
  };

  const saveCallRecord = async (callSid: string) => {
    try {
      const response = await fetch('/api/calling/save-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callSid,
          toNumber: callState.phoneNumber,
          customerId: callState.customerId,
          dealId: callState.dealId,
          leadId: callState.leadId,
        }),
      });

      const data = await response.json();
      if (data.callId) {
        setCallState((prev) => ({ ...prev, callRecordId: data.callId }));
      }
    } catch (error) {
      console.error('[CallContext] Error saving call record:', error);
    }
  };

  const initiateCall = useCallback(async (params: {
    phoneNumber: string;
    customerName?: string;
    customerId?: string;
    dealId?: string;
    leadId?: string;
    customerEmail?: string;
  }) => {
    try {
      // Set initial state
      setCallState({
        status: 'connecting',
        duration: 0,
        phoneNumber: params.phoneNumber,
        customerName: params.customerName,
        customerId: params.customerId,
        dealId: params.dealId,
        leadId: params.leadId,
        customerEmail: params.customerEmail,
        muted: false,
      });

      setMinimized(false);

      // Initialize device if not already initialized
      if (!deviceRef.current) {
        const { device, phoneNumber: callerIdNumber } = await initializeDevice();
        await makeCall(device, callerIdNumber, params.phoneNumber);
      } else {
        // Reuse existing device
        const response = await fetch('/api/calling/token');
        const data = await response.json();
        await makeCall(deviceRef.current, data.phoneNumber, params.phoneNumber);
      }
    } catch (error) {
      console.error('[CallContext] Error initiating call:', error);
      setCallState((prev) => ({ ...prev, status: 'ended' }));
    }
  }, []);

  const endCall = useCallback(() => {
    if (callRef.current) {
      callRef.current.disconnect();
    }
    setCallState((prev) => ({ ...prev, status: 'ended' }));
  }, []);

  const toggleMute = useCallback(() => {
    if (callRef.current) {
      const newMutedState = !callState.muted;
      callRef.current.mute(newMutedState);
      setCallState((prev) => ({ ...prev, muted: newMutedState }));
    }
  }, [callState.muted]);

  const sendDTMF = useCallback((digit: string) => {
    if (callRef.current && callState.status === 'connected') {
      callRef.current.sendDigits(digit);
      toast.success(`Sent: ${digit}`);
    }
  }, [callState.status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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

  return (
    <CallContext.Provider
      value={{
        callState,
        device: deviceRef.current,
        activeCall: callRef.current,
        initiateCall,
        endCall,
        toggleMute,
        sendDTMF,
        minimized,
        setMinimized,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
