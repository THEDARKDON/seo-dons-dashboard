'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { DealEditModal } from './deal-edit-modal';

interface DealEditButtonProps {
  deal: any;
}

export function DealEditButton({ deal }: DealEditButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Edit className="h-4 w-4" />
        Edit Deal
      </Button>
      <DealEditModal open={open} onOpenChange={setOpen} deal={deal} />
    </>
  );
}
