'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface DealEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: any;
}

export function DealEditModal({ open, onOpenChange, deal }: DealEditModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, first_name, last_name, company')
        .eq('status', 'active')
        .order('first_name');

      if (data) setCustomers(data);
    };
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      const { error } = await supabase
        .from('deals')
        .update({
          deal_name: formData.get('deal_name') as string,
          deal_value: parseFloat(formData.get('deal_value') as string),
          stage: formData.get('stage') as string,
          customer_id: formData.get('customer_id') as string || null,
          probability: parseInt(formData.get('probability') as string) || null,
          expected_close_date: formData.get('expected_close_date') as string || null,
          source: formData.get('source') as string || null,
          notes: formData.get('notes') as string || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deal.id);

      if (error) throw error;

      toast.success('Deal updated successfully!');
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error('Failed to update deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal_name">Deal Name *</Label>
            <Input
              id="deal_name"
              name="deal_name"
              defaultValue={deal.deal_name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_id">Customer</Label>
            <select
              id="customer_id"
              name="customer_id"
              defaultValue={deal.customer_id || ''}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">-- Select Customer (Optional) --</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.first_name} {customer.last_name}
                  {customer.company && ` - ${customer.company}`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deal_value">Deal Value ($) *</Label>
              <Input
                id="deal_value"
                name="deal_value"
                type="number"
                step="0.01"
                defaultValue={deal.deal_value}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage *</Label>
              <select
                id="stage"
                name="stage"
                defaultValue={deal.stage}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="prospecting">Prospecting</option>
                <option value="qualification">Qualification</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                name="probability"
                type="number"
                min="0"
                max="100"
                defaultValue={deal.probability || ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Expected Close Date</Label>
              <Input
                id="expected_close_date"
                name="expected_close_date"
                type="date"
                defaultValue={deal.expected_close_date || ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              name="source"
              defaultValue={deal.source || ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={deal.notes || ''}
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
