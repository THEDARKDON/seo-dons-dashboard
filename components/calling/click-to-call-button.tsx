'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';
import { toast } from 'sonner';
import { CallInterface } from './call-interface';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

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
  const [showCallInterface, setShowCallInterface] = useState(false);

  const handleCall = () => {
    if (!phoneNumber) {
      toast.error('No phone number provided');
      return;
    }

    setShowCallInterface(true);
  };

  const handleCallEnd = () => {
    setShowCallInterface(false);
  };

  return (
    <>
      <Button
        onClick={handleCall}
        disabled={!phoneNumber}
        variant={variant}
        size={size}
        className="gap-2"
      >
        <Phone className="h-4 w-4" />
        {showLabel && 'Call'}
      </Button>

      <Dialog open={showCallInterface} onOpenChange={setShowCallInterface}>
        <DialogContent className="sm:max-w-md">
          <CallInterface
            phoneNumber={phoneNumber}
            customerName={customerName}
            customerEmail={customerEmail}
            customerId={customerId}
            dealId={dealId}
            leadId={leadId}
            onEnd={handleCallEnd}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
