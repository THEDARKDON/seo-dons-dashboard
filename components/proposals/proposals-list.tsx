/**
 * Proposals List Component
 *
 * Displays all proposals generated for a customer
 * Supports HTML-first workflow with preview, edit, and PDF conversion
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Download, FileText, Clock, Eye, Edit, FileDown, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Proposal {
  id: string;
  proposal_number: string;
  package_tier: 'local' | 'regional' | 'national';
  status: 'generating' | 'html_ready' | 'ready' | 'error';
  generation_stage?: 'research' | 'content' | 'html_ready' | 'pdf_ready' | 'error';
  pdf_url: string | null;
  html_url: string | null;
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
  html_ready: 'default',
  ready: 'success',
  error: 'destructive',
} as const;

const statusLabels = {
  generating: 'Generating',
  html_ready: 'Review HTML',
  ready: 'Ready',
  error: 'Error',
};

export function ProposalsList({ proposals }: ProposalsListProps) {
  const router = useRouter();
  const [editingProposal, setEditingProposal] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isConverting, setIsConverting] = useState<string | null>(null);

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

  const handleEditProposal = async () => {
    if (!editingProposal || !editPrompt.trim()) return;

    setIsEditing(true);
    try {
      const response = await fetch(`/api/proposals/${editingProposal}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit proposal');
      }

      const data = await response.json();
      toast.success('Proposal edited successfully!');
      setEditingProposal(null);
      setEditPrompt('');
      router.refresh();

      // Open the new HTML in a new tab using view-html endpoint
      if (data.proposalId) {
        window.open(`/api/proposals/${data.proposalId}/view-html`, '_blank');
      }
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('Failed to edit proposal');
    } finally {
      setIsEditing(false);
    }
  };

  const handleConvertToPDF = async (proposalId: string) => {
    setIsConverting(proposalId);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/to-pdf`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to convert to PDF');
      }

      const data = await response.json();
      toast.success('PDF generated successfully!');
      router.refresh();

      // Open the PDF in a new tab
      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      }
    } catch (error) {
      console.error('PDF conversion error:', error);
      toast.error('Failed to convert to PDF');
    } finally {
      setIsConverting(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {proposals.map((proposal) => {
          const isHtmlReady = proposal.status === 'html_ready' || proposal.generation_stage === 'html_ready';
          const isPdfReady = proposal.status === 'ready' || proposal.generation_stage === 'pdf_ready';

          return (
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
                    {isHtmlReady && !isPdfReady && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Needs PDF Conversion
                      </Badge>
                    )}
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

              <div className="flex items-center gap-2">
                {/* HTML Preview - Available for html_ready and pdf_ready */}
                {(isHtmlReady || isPdfReady) && proposal.html_url && (
                  <a
                    href={`/api/proposals/${proposal.id}/view-html`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="gap-2">
                      <Eye className="h-4 w-4" />
                      View HTML
                    </Button>
                  </a>
                )}

                {/* Edit Button - Only for html_ready (before PDF) */}
                {isHtmlReady && !isPdfReady && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setEditingProposal(proposal.id)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}

                {/* Convert to PDF - Only for html_ready */}
                {isHtmlReady && !isPdfReady && (
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-2"
                    onClick={() => handleConvertToPDF(proposal.id)}
                    disabled={isConverting === proposal.id}
                  >
                    {isConverting === proposal.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <FileDown className="h-4 w-4" />
                        Convert to PDF
                      </>
                    )}
                  </Button>
                )}

                {/* Download PDF - Available when PDF is ready */}
                {isPdfReady && proposal.pdf_url && (
                  <a
                    href={proposal.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="default" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                  </a>
                )}

                {/* Generating State */}
                {proposal.status === 'generating' && (
                  <Button size="sm" variant="outline" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </Button>
                )}

                {/* Error State */}
                {proposal.status === 'error' && (
                  <Button size="sm" variant="outline" disabled>
                    Failed
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingProposal} onOpenChange={() => setEditingProposal(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Proposal with AI</DialogTitle>
            <DialogDescription>
              Describe how you want to modify the proposal. Claude will regenerate the HTML with your changes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-prompt">Edit Instructions</Label>
              <Textarea
                id="edit-prompt"
                placeholder="Example: Make the tone more aggressive, add more statistics about competitor performance, emphasize the urgency of acting now..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Be specific about what you want to change. The more detailed your instructions, the better the results.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingProposal(null)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditProposal}
              disabled={isEditing || !editPrompt.trim()}
            >
              {isEditing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                'Regenerate HTML'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
