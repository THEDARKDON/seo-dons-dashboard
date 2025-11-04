'use client';

/**
 * Proposal Generation Dialog
 *
 * Dialog that handles the complete proposal generation workflow:
 * - Package tier selection
 * - Real-time progress tracking via SSE
 * - Success/error handling
 * - PDF download
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Download, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProposalGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  companyName?: string;
}

type PackageTier = 'local' | 'regional' | 'national';

const packages = {
  local: {
    name: 'Local Dominance',
    price: '£2,000',
    description: '15-20 keywords, 8-12 content pieces, 10-15 backlinks',
    estimatedTime: '~90 seconds',
    estimatedCost: '£0.75',
  },
  regional: {
    name: 'Regional Authority',
    price: '£3,000',
    description: '25-35 keywords, 12-16 content pieces, 15-25 backlinks',
    estimatedTime: '~110 seconds',
    estimatedCost: '£1.00',
  },
  national: {
    name: 'National Leader',
    price: '£5,000',
    description: '40-60 keywords, 20-30 content pieces, 25-40 backlinks',
    estimatedTime: '~130 seconds',
    estimatedCost: '£1.25',
  },
};

export function ProposalGenerationDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  companyName,
}: ProposalGenerationDialogProps) {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<PackageTier>('local');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentStage('Starting...');
    setResult(null);
    setError('');

    try {
      // Make POST request to generate proposal
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          customerId,
          packageTier: selectedTier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate proposal');
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));

              if (data.error) {
                throw new Error(data.message || 'Generation failed');
              }

              if (data.complete) {
                // Proposal generation complete
                setResult(data);
                setProgress(100);
                setCurrentStage('Complete!');

                // Refresh the page to show the new proposal
                router.refresh();
              } else {
                // Progress update
                setProgress(data.progress || 0);
                setCurrentStage(data.stage || '');
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error generating proposal:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false);
      // Reset state after closing
      setTimeout(() => {
        setSelectedTier('local');
        setProgress(0);
        setCurrentStage('');
        setResult(null);
        setError('');
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate SEO Proposal</DialogTitle>
          <DialogDescription>
            Create a professional 18-page SEO proposal for {customerName}
            {companyName && ` (${companyName})`}
          </DialogDescription>
        </DialogHeader>

        {!isGenerating && !result && (
          <div className="space-y-6">
            {/* Package Selection */}
            <div>
              <h3 className="font-semibold mb-3">Select Package Tier</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.keys(packages) as PackageTier[]).map((tier) => {
                  const pkg = packages[tier];
                  return (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedTier === tier
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-lg mb-1">{pkg.name}</div>
                      <div className="text-sm text-gray-600 mb-2">{pkg.price}/mo</div>
                      <div className="text-xs text-gray-500 mb-3">
                        {pkg.description}
                      </div>
                      <div className="text-xs text-gray-400">
                        Generation: {pkg.estimatedTime}
                      </div>
                      <div className="text-xs text-gray-400">
                        Cost: {pkg.estimatedCost}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Package Summary */}
            <Alert>
              <AlertDescription>
                <strong>Selected:</strong> {packages[selectedTier].name}
                <br />
                <strong>Estimated generation time:</strong> {packages[selectedTier].estimatedTime}
                <br />
                <strong>Estimated cost:</strong> {packages[selectedTier].estimatedCost} (Claude API)
              </AlertDescription>
            </Alert>

            {/* Generate Button */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate}>Generate Proposal</Button>
            </div>
          </div>
        )}

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-4 py-6">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{currentStage}</span>
                <span className="text-gray-600">{progress}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-gray-500 text-center">
                This will take {packages[selectedTier].estimatedTime}. Please do not close this dialog.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {result && (
          <div className="space-y-4 py-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2 ml-6">
                  <div className="font-bold text-green-900">
                    Proposal Generated Successfully!
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Proposal Number:</strong> {result.proposalNumber}
                    </p>
                    <p>
                      <strong>Package:</strong> {packages[selectedTier].name}
                    </p>
                    <p>
                      <strong>Duration:</strong> {result.metadata?.totalDurationSeconds}s
                    </p>
                    <p>
                      <strong>Cost:</strong> £
                      {result.metadata?.totalCost?.toFixed(4)}
                    </p>
                    <p>
                      <strong>Tokens:</strong>{' '}
                      {result.metadata?.totalTokensUsed?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <a
                href={result.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
