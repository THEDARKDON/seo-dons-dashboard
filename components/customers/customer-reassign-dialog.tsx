'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface UserForAssignment {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string | null;
}

interface CustomerReassignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  currentOwnerId?: string;
  customerName: string;
  onReassigned?: () => void;
}

export function CustomerReassignDialog({
  open,
  onOpenChange,
  customerId,
  currentOwnerId,
  customerName,
  onReassigned
}: CustomerReassignDialogProps) {
  const [users, setUsers] = useState<UserForAssignment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
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

    // First, reassign the customer
    const { error: customerError } = await supabase
      .from('customers')
      .update({ owned_by: selectedUserId })
      .eq('id', customerId);

    if (customerError) {
      console.error('Error reassigning customer:', customerError);
      toast.error('Failed to reassign customer');
      setLoading(false);
      return;
    }

    // Then, reassign all deals associated with this customer
    const { error: dealsError } = await supabase
      .from('deals')
      .update({ assigned_to: selectedUserId })
      .eq('customer_id', customerId);

    if (dealsError) {
      console.error('Error reassigning deals:', dealsError);
      toast.error('Customer reassigned but failed to reassign associated deals');
    } else {
      toast.success('Customer and associated deals reassigned successfully');
    }

    onReassigned?.();
    onOpenChange(false);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign Customer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Reassign <span className="font-medium">{customerName}</span> to a new owner:
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
                    disabled={user.id === currentOwnerId}
                  >
                    {user.first_name} {user.last_name}
                    {user.role && ` (${user.role})`}
                    {user.id === currentOwnerId && ' (current owner)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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