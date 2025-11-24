'use client';

import { useEffect } from 'react';
import { useCall } from '@/contexts/CallContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Calendar,
} from 'lucide-react';
import { CalendarBookingModal } from '@/components/calendar/calendar-booking-modal';
import { useState } from 'react';
import { DTMFKeypad } from '@/components/calling/dtmf-keypad';

export function FloatingCallWidget() {
  const { callState, endCall, toggleMute, minimized, setMinimized } = useCall();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  // Hide widget when call is idle
  if (callState.status === 'idle') {
    return null;
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (callState.status) {
      case 'connecting':
        return 'secondary';
      case 'ringing':
        return 'default';
      case 'connected':
        return 'success';
      case 'ended':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (callState.status) {
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return formatDuration(callState.duration);
      case 'ended':
        return 'Call Ended';
      default:
        return '';
    }
  };

  if (minimized) {
    // Minimized view - small floating badge
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="p-3 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setMinimized(false)}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Phone className="h-5 w-5 text-green-600" />
              {callState.status === 'connected' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{callState.customerName || callState.phoneNumber}</span>
              <span className="text-xs text-muted-foreground">{getStatusText()}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                endCall();
              }}
              className="ml-2"
            >
              <PhoneOff className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Expanded view - full call interface
  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 w-96">
        <Card className="shadow-2xl">
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {callState.customerName || 'Unknown'}
                </h3>
                <p className="text-sm text-muted-foreground">{callState.phoneNumber}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMinimized(true)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Status */}
            <div className="text-center py-4">
              <Badge variant={getStatusColor()} className="text-lg px-4 py-2">
                {getStatusText()}
              </Badge>
            </div>

            {/* Call Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                variant={callState.muted ? 'default' : 'outline'}
                onClick={toggleMute}
                disabled={callState.status !== 'connected'}
                className="rounded-full w-14 h-14"
              >
                {callState.muted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowKeypad(!showKeypad)}
                disabled={callState.status !== 'connected'}
                className="rounded-full w-14 h-14"
              >
                <span className="text-lg font-bold">#</span>
              </Button>

              <Button
                size="lg"
                variant="destructive"
                onClick={endCall}
                className="rounded-full w-16 h-16"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>

            {/* DTMF Keypad */}
            {showKeypad && callState.status === 'connected' && (
              <DTMFKeypad />
            )}

            {/* Post-call actions */}
            {callState.status === 'ended' && callState.customerEmail && (
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm text-center text-muted-foreground mb-3">
                  Would you like to schedule a follow-up?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowBookingModal(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Reset call state by ending completely
                      endCall();
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Calendar Booking Modal */}
      {showBookingModal && callState.customerEmail && (
        <CalendarBookingModal
          open={showBookingModal}
          onOpenChange={setShowBookingModal}
          customerEmail={callState.customerEmail}
          customerName={callState.customerName}
          customerId={callState.customerId}
          dealId={callState.dealId}
          leadId={callState.leadId}
          callRecordId={callState.callRecordId}
        />
      )}
    </>
  );
}
