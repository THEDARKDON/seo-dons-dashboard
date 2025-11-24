'use client';

import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useCall } from '@/contexts/CallContext';

interface ClickToCallButtonProps {
  phoneNumber: string;
  customerId?: string;
  dealId?: string;
  leadId?: string;
  customerName?: string;
  customerEmail?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function ClickToCallButton({
  phoneNumber,
  customerId,
  dealId,
  leadId,
  customerName,
  customerEmail,
  variant = 'default',
  size = 'default',
  showLabel = true,
}: ClickToCallButtonProps) {
  const { initiateCall, callState } = useCall();

  const handleCall = async () => {
    if (!phoneNumber) {
      toast.error('No phone number provided');
      return;
    }

    // Don't allow new call if one is already active
    if (callState.status !== 'idle' && callState.status !== 'ended') {
      toast.error('A call is already in progress');
      return;
    }

    await initiateCall({
      phoneNumber,
      customerName,
      customerId,
      dealId,
      leadId,
      customerEmail,
    });
  };

  return (
    <Button
      onClick={handleCall}
      disabled={!phoneNumber || (callState.status !== 'idle' && callState.status !== 'ended')}
      variant={variant}
      size={size}
      className="gap-2"
    >
      <Phone className="h-4 w-4" />
      {showLabel && 'Call'}
    </Button>
  );
}
