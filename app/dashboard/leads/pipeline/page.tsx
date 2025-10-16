import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { LeadPipelineBoard } from '@/components/leads/lead-pipeline-board';
import { Button } from '@/components/ui/button';
import { Plus, List } from 'lucide-react';
import Link from 'next/link';

async function getLeadsPipelineData(userId: string) {
  try {
    const supabase = await createClient();

    // Get user's Supabase ID and role
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return { leads: [] };
    }

    // Get leads (managers/admins see all, BDRs see only their own)
    const query = supabase
      .from('leads')
      .select(`
        *,
        users!leads_assigned_to_fkey (id, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    // Apply filter based on role
    if (user.role === 'bdr') {
      query.eq('assigned_to', user.id);
    }

    const { data: leads } = await query;

    return { leads: leads || [] };
  } catch (error) {
    console.error('Error fetching leads pipeline:', error);
    return { leads: [] };
  }
}

export default async function LeadsPipelinePage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const { leads } = await getLeadsPipelineData(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Pipeline</h1>
          <p className="text-muted-foreground">Drag and drop leads to update their status</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/leads">
            <Button variant="outline" className="gap-2">
              <List className="h-4 w-4" />
              List View
            </Button>
          </Link>
          <Link href="/dashboard/leads/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Lead
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<div>Loading pipeline...</div>}>
        <LeadPipelineBoard initialLeads={leads} />
      </Suspense>
    </div>
  );
}
