'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface UserForAssignment {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string | null;
}

interface DealReassignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  currentAssignedTo?: string;
  dealName: string;
  customerId?: string | null;
  onReassigned?: () => void;
}

export function DealReassignDialog({
  open,
  onOpenChange,
  dealId,
  currentAssignedTo,
  dealName,
  customerId,
  onReassigned
}: DealReassignDialogProps) {
  const [users, setUsers] = useState<UserForAssignment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [reassignCustomer, setReassignCustomer] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
      setReassignCustomer(false); // Reset checkbox when dialog opens
    }
  }, [open]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .order('first_name');

    if (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      return;
    }

    setUsers(data || []);
  };

  const handleReassign = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    setLoading(true);

    // First, reassign the deal
    const { error: dealError } = await supabase
      .from('deals')
      .update({ assigned_to: selectedUserId })
      .eq('id', dealId);

    if (dealError) {
      console.error('Error reassigning deal:', dealError);
      toast.error('Failed to reassign deal');
      setLoading(false);
      return;
    }

    // If checkbox is checked and there's a customer, reassign the customer too
    if (reassignCustomer && customerId) {
      const { error: customerError } = await supabase
        .from('customers')
        .update({ owned_by: selectedUserId })
        .eq('id', customerId);

      if (customerError) {
        console.error('Error reassigning customer:', customerError);
        toast.error('Deal reassigned but failed to reassign associated customer');
      } else {
        // Also reassign other deals for this customer
        const { error: otherDealsError } = await supabase
          .from('deals')
          .update({ assigned_to: selectedUserId })
          .eq('customer_id', customerId)
          .neq('id', dealId); // Don't update the current deal again

        if (otherDealsError) {
          console.error('Error reassigning other deals:', otherDealsError);
          toast.error('Customer reassigned but some associated deals may not have been updated');
        } else {
          toast.success('Deal, customer, and all associated deals reassigned successfully');
        }
      }
    } else {
      toast.success('Deal reassigned successfully');
    }

    onReassigned?.();
    onOpenChange(false);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign Deal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Reassign <span className="font-medium">{dealName}</span> to a new owner:
            </p>

            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem
                    key={user.id}
                    value={user.id}
                    disabled={user.id === currentAssignedTo}
                  >
                    {user.first_name} {user.last_name}
                    {user.role && ` (${user.role})`}
                    {user.id === currentAssignedTo && ' (current owner)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {customerId && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reassign-customer"
                checked={reassignCustomer}
                onCheckedChange={(checked) => setReassignCustomer(!!checked)}
              />
              <label
                htmlFor="reassign-customer"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Also reassign the customer and all their deals
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReassign} disabled={loading || !selectedUserId}>
            {loading ? 'Reassigning...' : 'Reassign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}