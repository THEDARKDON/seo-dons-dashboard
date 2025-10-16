'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface CustomerDeleteButtonProps {
  customerId: string;
  customerName: string;
}

export function CustomerDeleteButton({ customerId, customerName }: CustomerDeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    const { error } = await supabase.from('customers').delete().eq('id', customerId);

    if (error) {
      alert('Error deleting customer: ' + error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard/customers');
    router.refresh();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Customer</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {customerName}? This action cannot be undone and will
            also remove all associated deals and activities.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
