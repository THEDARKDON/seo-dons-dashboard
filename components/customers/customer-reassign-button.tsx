'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { CustomerReassignDialog } from './customer-reassign-dialog';
import { useRouter } from 'next/navigation';

interface CustomerReassignButtonProps {
  customerId: string;
  currentOwnerId?: string;
  customerName: string;
}

export function CustomerReassignButton({
  customerId,
  currentOwnerId,
  customerName
}: CustomerReassignButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleReassigned = () => {
    router.refresh();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4 mr-2" />
        Reassign
      </Button>

      <CustomerReassignDialog
        open={open}
        onOpenChange={setOpen}
        customerId={customerId}
        currentOwnerId={currentOwnerId}
        customerName={customerName}
        onReassigned={handleReassigned}
      />
    </>
  );
}