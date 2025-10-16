import { NewLeadForm } from '@/components/leads/new-lead-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewLeadPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leads">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Leads
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Lead</h1>
          <p className="text-muted-foreground">
            Add a new lead to your CRM
          </p>
        </div>
      </div>

      <NewLeadForm />
    </div>
  );
}
