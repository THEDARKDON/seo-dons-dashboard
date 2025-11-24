import { CSVImportWizard } from '@/components/leads/csv-import-wizard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LeadImportPage() {
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
          <h1 className="text-3xl font-bold">Import Leads from CSV</h1>
          <p className="text-muted-foreground">
            Upload a CSV file to bulk import leads into your CRM
          </p>
        </div>
      </div>

      <CSVImportWizard />
    </div>
  );
}
