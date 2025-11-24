'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { DealReassignDialog } from './deal-reassign-dialog';
import { useRouter } from 'next/navigation';

interface DealReassignButtonProps {
  dealId: string;
  currentAssignedTo?: string;
  dealName: string;
  customerId?: string | null;
}

export function DealReassignButton({
  dealId,
  currentAssignedTo,
  dealName,
  customerId
}: DealReassignButtonProps) {
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

      <DealReassignDialog
        open={open}
        onOpenChange={setOpen}
        dealId={dealId}
        currentAssignedTo={currentAssignedTo}
        dealName={dealName}
        customerId={customerId}
        onReassigned={handleReassigned}
      />
    </>
  );
}