'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';
import { toast } from 'sonner';

interface ClickToCallButtonProps {
  phoneNumber: string;
  customerId?: string;
  dealId?: string;
  leadId?: string;
  customerName?: string;
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
  variant = 'default',
  size = 'default',
  showLabel = true,
}: ClickToCallButtonProps) {
  const [calling, setCalling] = useState(false);

  const handleCall = async () => {
    if (!phoneNumber) {
      toast.error('No phone number provided');
      return;
    }

    setCalling(true);

    try {
      const response = await fetch('/api/calling/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toNumber: phoneNumber,
          customerId,
          dealId,
          leadId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to make call');
      }

      toast.success(
        customerName
          ? `Calling ${customerName}...`
          : `Calling ${phoneNumber}...`
      );

      // Open call interface (we'll implement this next)
      // For now, just show success
      setTimeout(() => {
        setCalling(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error making call:', error);
      toast.error(error.message || 'Failed to make call');
      setCalling(false);
    }
  };

  return (
    <Button
      onClick={handleCall}
      disabled={calling || !phoneNumber}
      variant={variant}
      size={size}
      className="gap-2"
    >
      {calling ? (
        <>
          <PhoneOff className="h-4 w-4 animate-pulse" />
          {showLabel && 'Calling...'}
        </>
      ) : (
        <>
          <Phone className="h-4 w-4" />
          {showLabel && 'Call'}
        </>
      )}
    </Button>
  );
}
