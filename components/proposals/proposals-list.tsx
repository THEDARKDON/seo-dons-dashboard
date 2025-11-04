/**
 * Proposals List Component
 *
 * Displays all proposals generated for a customer
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Proposal {
  id: string;
  proposal_number: string;
  package_tier: 'local' | 'regional' | 'national';
  status: 'generating' | 'ready' | 'error';
  pdf_url: string | null;
  estimated_cost: number;
  generation_duration: number;
  created_at: string;
  error_message?: string | null;
}

interface ProposalsListProps {
  proposals: Proposal[];
}

const packageLabels = {
  local: 'Local Dominance',
  regional: 'Regional Authority',
  national: 'National Leader',
};

const statusColors = {
  generating: 'default',
  ready: 'success',
  error: 'destructive',
} as const;

const statusLabels = {
  generating: 'Generating',
  ready: 'Ready',
  error: 'Error',
};

export function ProposalsList({ proposals }: ProposalsListProps) {
  if (proposals.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-muted-foreground">No proposals generated yet</p>
        <p className="text-sm text-muted-foreground">
          Click &quot;Generate Proposal&quot; to create your first SEO proposal
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((proposal) => (
        <div
          key={proposal.id}
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-2">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{proposal.proposal_number}</p>
                <Badge variant={statusColors[proposal.status]}>
                  {statusLabels[proposal.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {packageLabels[proposal.package_tier]} • Created{' '}
                {formatDate(proposal.created_at)}
              </p>
              {proposal.generation_duration && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  Generated in {proposal.generation_duration}s • Cost: £
                  {proposal.estimated_cost.toFixed(4)}
                </p>
              )}
              {proposal.error_message && (
                <p className="text-xs text-red-600 mt-1">{proposal.error_message}</p>
              )}
            </div>
          </div>
          <div>
            {proposal.status === 'ready' && proposal.pdf_url ? (
              <a
                href={proposal.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </a>
            ) : proposal.status === 'generating' ? (
              <Button size="sm" variant="outline" disabled>
                Generating...
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                Failed
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
