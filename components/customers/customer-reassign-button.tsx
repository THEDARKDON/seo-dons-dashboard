/**
 * Customer Reassignment Button
 *
 * Allows admins/managers to reassign customers to different SDRs
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserCog } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface CustomerReassignButtonProps {
  customerId: string;
  currentOwnerId: string | null;
  customerName: string;
  userRole?: string;
}

export function CustomerReassignButton({
  customerId,
  currentOwnerId,
  customerName,
  userRole,
}: CustomerReassignButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  // Only show for admins and managers
  if (!userRole || !['admin', 'manager'].includes(userRole)) {
    return null;
  }

  const loadUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .order('full_name');

    if (data) {
      setUsers(data);
      // Set current owner as default selection if exists
      if (currentOwnerId) {
        setSelectedUserId(currentOwnerId);
      }
    }
  };

  const handleReassign = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user to assign to');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('customers')
      .update({ owned_by: selectedUserId })
      .eq('id', customerId);

    if (error) {
      toast.error('Failed to reassign customer');
      console.error('Reassignment error:', error);
    } else {
      toast.success('Customer reassigned successfully');
      setOpen(false);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCog className="h-4 w-4" />
          Reassign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign Customer</DialogTitle>
          <DialogDescription>
            Reassign &quot;{customerName}&quot; to a different SDR or manager.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user">Assign to</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{user.full_name || user.email}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({user.role})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentOwnerId && (
            <p className="text-sm text-muted-foreground">
              Currently assigned to:{' '}
              {users.find((u) => u.id === currentOwnerId)?.full_name ||
                users.find((u) => u.id === currentOwnerId)?.email ||
                'Unknown'}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleReassign} disabled={loading}>
            {loading ? 'Reassigning...' : 'Reassign Customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}