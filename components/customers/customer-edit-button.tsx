'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CustomerEditModal } from './customer-edit-modal';

interface CustomerEditButtonProps {
  customer: any;
}

export function CustomerEditButton({ customer }: CustomerEditButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit Customer</Button>
      <CustomerEditModal open={open} onOpenChange={setOpen} customer={customer} />
    </>
  );
}
