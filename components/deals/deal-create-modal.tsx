'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { PIPELINE_STAGES } from '@/lib/constants/pipeline-stages';

interface DealCreateModalProps {
  customerId?: string;
  customerName?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export function DealCreateModal({ customerId, customerName, onSuccess, trigger }: DealCreateModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [formData, setFormData] = useState({
    deal_name: '',
    deal_value: '',
    stage: 'new_leads_call', // Default to the first stage
    probability: '',
    expected_close_date: '',
    source: '',
    notes: '',
    assigned_to: '', // Will be set to current user by default
  });

  // Load users when modal opens
  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      // Get current user's Supabase ID first
      const { data: currentDbUser } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user?.id)
        .single();

      if (currentDbUser) {
        // Set default assigned_to to current user
        setFormData(prev => ({ ...prev, assigned_to: currentDbUser.id }));
      }

      // Fetch all users for assignment dropdown
      const { data: allUsers, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .order('first_name', { ascending: true });

      if (error) throw error;

      setUsers(allUsers || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the assigned_to from form data (already set)
      const assignedUserId = formData.assigned_to;

      if (!assignedUserId) {
        toast.error('Please select a user to assign this deal to.');
        return;
      }

      // Create deal
      const { data, error } = await supabase
        .from('deals')
        .insert({
          assigned_to: assignedUserId,
          deal_name: formData.deal_name,
          deal_value: parseFloat(formData.deal_value) || 0,
          stage: formData.stage,
          customer_id: customerId || null,
          probability: parseInt(formData.probability) || null,
          expected_close_date: formData.expected_close_date || null,
          source: formData.source || null,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Deal created successfully!');
      setOpen(false);

      // Reset form
      setFormData({
        deal_name: '',
        deal_value: '',
        stage: 'new_leads_call',
        probability: '',
        expected_close_date: '',
        source: '',
        notes: '',
        assigned_to: '',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/deals/${data.id}`);
      }
      router.refresh();
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
          <DialogDescription>
            {customerName ? `Create a new deal for ${customerName}` : 'Create a new sales opportunity'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal_name">Deal Name *</Label>
            <Input
              id="deal_name"
              value={formData.deal_name}
              onChange={(e) => setFormData({ ...formData, deal_name: e.target.value })}
              placeholder="e.g., Acme Corp - SEO Package"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To *</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              disabled={loadingUsers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select SDR"} />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal_value">Deal Value *</Label>
              <Input
                id="deal_value"
                type="number"
                step="0.01"
                value={formData.deal_value}
                onChange={(e) => setFormData({ ...formData, deal_value: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage *</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData({ ...formData, stage: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((stage) => (
                    <SelectItem key={stage.id} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="probability">Probability %</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                placeholder="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Expected Close Date</Label>
              <Input
                id="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="e.g., Website, Referral, Cold Call"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details about this deal..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
