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
import { CheckCircle2, Download, Loader2, FileText, Files } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ProposalGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  companyName?: string;
}

type PackageTier = 'local' | 'regional' | 'national';
type ProposalMode = 'concise' | 'detailed';
type TemplateStyle = 'classic' | 'modern';

const packages = {
  local: {
    name: 'Local Dominance',
    price: '£2,000',
    description: '15-20 keywords, 8-12 content pieces, 10-15 backlinks',
    estimatedTime: '3-4 minutes',
    estimatedCost: '£0.75',
  },
  regional: {
    name: 'Regional Authority',
    price: '£3,000',
    description: '25-35 keywords, 12-16 content pieces, 15-25 backlinks',
    estimatedTime: '4-5 minutes',
    estimatedCost: '£1.00',
  },
  national: {
    name: 'National Leader',
    price: '£5,000',
    description: '40-60 keywords, 20-30 content pieces, 25-40 backlinks',
    estimatedTime: '5-6 minutes',
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
  const [proposalMode, setProposalMode] = useState<ProposalMode>('detailed');
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>('classic');
  const [preferOpus, setPreferOpus] = useState(false);
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
          proposalMode: proposalMode,
          templateStyle: templateStyle,
          preferOpus: preferOpus,
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
        setProposalMode('detailed');
        setTemplateStyle('classic');
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

            {/* Proposal Format Selection */}
            <div>
              <h3 className="font-semibold mb-3">Proposal Format</h3>
              <RadioGroup
                defaultValue="detailed"
                value={proposalMode}
                onValueChange={(value: ProposalMode) => setProposalMode(value)}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    proposalMode === 'concise'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value="concise" id="concise" className="mt-1" />
                    <Label htmlFor="concise" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4" />
                        <span className="font-semibold">Concise Proposal</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        5-6 pages • Quick overview • Key highlights
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Perfect for follow-ups and initial presentations
                      </p>
                    </Label>
                  </div>

                  <div className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    proposalMode === 'detailed'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value="detailed" id="detailed" className="mt-1" />
                    <Label htmlFor="detailed" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Files className="h-4 w-4" />
                        <span className="font-semibold">Detailed Proposal</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        10-12 pages • Comprehensive analysis • Full strategy
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Complete proposal with in-depth research and insights
                      </p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Template Style Selection */}
            <div>
              <h3 className="font-semibold mb-3">Template Style</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Classic Template */}
                <label
                  className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    templateStyle === 'classic'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="templateStyle"
                    value="classic"
                    checked={templateStyle === 'classic'}
                    onChange={() => setTemplateStyle('classic')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Classic Template</span>
                    {templateStyle === 'classic' && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Traditional PDF-style layout. Perfect for formal proposals and attachments.
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Professional PDF appearance</li>
                    <li>• Detailed technical sections</li>
                    <li>• Printable format</li>
                  </ul>
                </label>

                {/* Modern Template */}
                <label
                  className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    templateStyle === 'modern'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="templateStyle"
                    value="modern"
                    checked={templateStyle === 'modern'}
                    onChange={() => setTemplateStyle('modern')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Modern Template</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full font-medium">
                        NEW
                      </span>
                      {templateStyle === 'modern' && (
                        <CheckCircle2 className="h-5 w-5 text-teal-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Beautiful web-first design with video testimonials.
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Mobile-responsive layout</li>
                    <li>• 5 embedded video testimonials</li>
                    <li>• Perfect for presentations</li>
                  </ul>
                </label>
              </div>

              {/* Modern Template Info */}
              {templateStyle === 'modern' && (
                <Alert className="mt-4 bg-teal-50 border-teal-200">
                  <AlertDescription className="text-sm text-teal-800">
                    ✨ Modern template features beautiful Tailwind CSS styling, embedded video
                    testimonials, and mobile-responsive design perfect for client presentations
                    and screen sharing during sales calls.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Model Selection (Advanced) */}
            <div>
              <h3 className="font-semibold mb-3">Content Generation Quality</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sonnet 4 (Default) */}
                <label
                  className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    !preferOpus
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value="sonnet"
                    checked={!preferOpus}
                    onChange={() => setPreferOpus(false)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Standard Quality</span>
                    {!preferOpus && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Claude Sonnet 4 • Cost-effective • 95% quality
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Recommended for most proposals</li>
                    <li>• 80% lower cost than maximum quality</li>
                    <li>• Enhanced prompt ensures completeness</li>
                  </ul>
                </label>

                {/* Opus 4 (Premium) */}
                <label
                  className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    preferOpus
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value="opus"
                    checked={preferOpus}
                    onChange={() => setPreferOpus(true)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Maximum Quality</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full font-medium">
                        PREMIUM
                      </span>
                      {preferOpus && (
                        <CheckCircle2 className="h-5 w-5 text-purple-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Claude Opus 4 • Highest reliability • 99.9% quality
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Best for critical/high-value proposals</li>
                    <li>• 5x cost but guaranteed completeness</li>
                    <li>• Maximum attention to requirements</li>
                  </ul>
                </label>
              </div>

              {/* Opus Info */}
              {preferOpus && (
                <Alert className="mt-4 bg-purple-50 border-purple-200">
                  <AlertDescription className="text-sm text-purple-800">
                    💎 Maximum quality mode uses Claude Opus 4, which is more expensive but provides
                    the highest reliability for following complex instructions. Recommended for proposals
                    where quality is critical.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Selected Package Summary */}
            <Alert>
              <AlertDescription>
                <strong>Selected:</strong> {packages[selectedTier].name} • {proposalMode === 'concise' ? 'Concise' : 'Detailed'} Format • {templateStyle === 'classic' ? 'Classic' : 'Modern'} Template • {preferOpus ? 'Maximum Quality' : 'Standard Quality'}
                <br />
                <strong>Estimated generation time:</strong> {packages[selectedTier].estimatedTime}
                <br />
                <strong>Estimated cost:</strong> {preferOpus ? `£${(parseFloat(packages[selectedTier].estimatedCost.replace('£', '')) * 5).toFixed(2)}` : packages[selectedTier].estimatedCost} (Claude API{preferOpus ? ' - Opus 4' : ' - Sonnet 4'})
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
