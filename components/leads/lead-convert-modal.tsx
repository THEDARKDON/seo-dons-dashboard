'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LeadConvertModalProps {
  leadId: string;
  leadName: string;
}

export function LeadConvertModal({ leadId, leadName }: LeadConvertModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createDeal, setCreateDeal] = useState(false);
  const [dealValue, setDealValue] = useState('');
  const [dealName, setDealName] = useState('');

  const handleConvert = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/leads/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          createDeal,
          dealValue: createDeal ? parseFloat(dealValue) : undefined,
          dealName: createDeal ? dealName || `Deal with ${leadName}` : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to convert lead');
      }

      toast.success('Lead converted to customer!');

      if (result.customerId) {
        router.push(`/dashboard/customers/${result.customerId}`);
      } else {
        router.push('/dashboard/customers');
      }
      router.refresh();
    } catch (error: any) {
      console.error('Conversion error:', error);
      toast.error(error.message || 'Failed to convert lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <ArrowRight className="h-4 w-4" />
          Convert to Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert Lead to Customer</DialogTitle>
          <DialogDescription>
            This will convert <strong>{leadName}</strong> into a customer. All lead information will be transferred.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="create-deal"
              checked={createDeal}
              onCheckedChange={(checked) => setCreateDeal(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="create-deal" className="font-medium cursor-pointer">
                Create a deal for this customer
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically create an opportunity in the pipeline
              </p>
            </div>
          </div>

          {createDeal && (
            <div className="space-y-3 pl-7">
              <div className="space-y-2">
                <Label htmlFor="deal-name">Deal Name</Label>
                <Input
                  id="deal-name"
                  placeholder={`Deal with ${leadName}`}
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deal-value">Deal Value ($)</Label>
                <Input
                  id="deal-value"
                  type="number"
                  placeholder="5000"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  required={createDeal}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={loading || (createDeal && !dealValue)}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Convert Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
