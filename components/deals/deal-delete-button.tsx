'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface DealDeleteButtonProps {
  dealId: string;
  dealName: string;
}

export function DealDeleteButton({ dealId, dealName }: DealDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;

      toast.success('Deal deleted successfully');
      router.push('/dashboard/deals');
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="icon"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{dealName}"? This action cannot be undone.
              All associated commissions and activities will remain but will no longer be linked to this deal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete Deal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
