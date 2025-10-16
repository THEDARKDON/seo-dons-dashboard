import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { PipelineBoard } from '@/components/pipeline/pipeline-board';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

async function getPipelineData(userId: string) {
  try {
    const supabase = await createClient();

    // Get user's Supabase ID and role
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return { deals: [] };
    }

    // Get deals (managers/admins see all, BDRs see only their own)
    const query = supabase
      .from('deals')
      .select(`
        *,
        customers (id, first_name, last_name, company, email, phone),
        users!deals_assigned_to_fkey (id, first_name, last_name, email)
      `)
      .order('stage_position', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filter based on role
    if (user.role === 'bdr') {
      query.eq('assigned_to', user.id);
    }

    const { data: deals } = await query;

    return { deals: deals || [] };
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    return { deals: [] };
  }
}

export default async function PipelinePage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const { deals } = await getPipelineData(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground">Drag and drop deals to update their stage</p>
        </div>
        <Link href="/dashboard/deals/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Loading pipeline...</div>}>
        <PipelineBoard initialDeals={deals} />
      </Suspense>
    </div>
  );
}
