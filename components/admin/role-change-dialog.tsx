'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RoleChangeDialogProps {
  userId: string;
  currentRole: string;
  userName: string;
}

const roleLabels = {
  admin: 'Admin',
  manager: 'Manager',
  bdr: 'BDR',
  sdr: 'SDR',
};

const roleDescriptions = {
  admin: 'Full access to all features and settings',
  manager: 'Can view all SDR data and reports',
  bdr: 'Business Development Representative',
  sdr: 'Sales Development Representative',
};

export function RoleChangeDialog({ userId, currentRole, userName }: RoleChangeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);

  const handleRoleChange = async () => {
    if (selectedRole === currentRole) {
      toast.error('Please select a different role');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change role');
      }

      toast.success(data.message || 'Role updated successfully');
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error(error.message || 'Failed to change role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="h-4 w-4 mr-2" />
          Change Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update role for {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="role">Select New Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">
                        {roleDescriptions[value as keyof typeof roleDescriptions]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRole !== currentRole && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Changing from{' '}
                <strong>{roleLabels[currentRole as keyof typeof roleLabels]}</strong> to{' '}
                <strong>{roleLabels[selectedRole as keyof typeof roleLabels]}</strong> will
                immediately update the user's permissions.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRoleChange}
            disabled={loading || selectedRole === currentRole}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Role
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
