'use client';

/**
 * Generate Proposal Button Component
 *
 * Opens a dialog to generate a new SEO proposal for a customer
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { ProposalGenerationDialog } from './proposal-generation-dialog';

interface GenerateProposalButtonProps {
  customerId: string;
  customerName: string;
  companyName?: string;
  trigger?: React.ReactNode;
}

export function GenerateProposalButton({
  customerId,
  customerName,
  companyName,
  trigger,
}: GenerateProposalButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)} className="gap-2">
          <FileText className="h-4 w-4" />
          Generate Proposal
        </Button>
      )}

      <ProposalGenerationDialog
        open={open}
        onOpenChange={setOpen}
        customerId={customerId}
        customerName={customerName}
        companyName={companyName}
      />
    </>
  );
}
