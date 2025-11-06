'use client';

/**
 * Test Page for Proposal Generation
 *
 * Use this page to test the complete proposal generation workflow
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase/client';

interface Customer {
  id: string;
  company_name: string;
  website: string;
  industry: string;
}

export default function TestProposalPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [packageTier, setPackageTier] = useState<'local' | 'regional' | 'national'>('local');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, company_name, website, industry')
      .order('company_name')
      .limit(20);

    if (error) {
      console.error('Error loading customers:', error);
      setError('Failed to load customers');
      return;
    }

    setCustomers(data || []);
    if (data && data.length > 0) {
      setSelectedCustomer(data[0].id);
    }
  };

  const generateProposal = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

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
        body: JSON.stringify({
          customerId: selectedCustomer,
          packageTier,
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

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Proposal Generation</CardTitle>
          <CardDescription>
            Test the complete proposal generation workflow with real customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Customer
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              disabled={isGenerating}
              className="w-full p-2 border rounded-md"
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.company_name} {customer.website && `(${customer.website})`}
                </option>
              ))}
            </select>
            {selectedCustomerData && (
              <p className="text-sm text-gray-600 mt-2">
                Industry: {selectedCustomerData.industry || 'Not specified'}
              </p>
            )}
          </div>

          {/* Package Tier Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Package Tier
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setPackageTier('local')}
                disabled={isGenerating}
                className={`p-4 border rounded-md text-center ${
                  packageTier === 'local'
                    ? 'bg-blue-50 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-bold">Local</div>
                <div className="text-sm text-gray-600">£2,000/mo</div>
              </button>
              <button
                onClick={() => setPackageTier('regional')}
                disabled={isGenerating}
                className={`p-4 border rounded-md text-center ${
                  packageTier === 'regional'
                    ? 'bg-blue-50 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-bold">Regional</div>
                <div className="text-sm text-gray-600">£3,000/mo</div>
              </button>
              <button
                onClick={() => setPackageTier('national')}
                disabled={isGenerating}
                className={`p-4 border rounded-md text-center ${
                  packageTier === 'national'
                    ? 'bg-blue-50 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-bold">National</div>
                <div className="text-sm text-gray-600">£5,000/mo</div>
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateProposal}
            disabled={isGenerating || !selectedCustomer}
            className="w-full"
            size="lg"
          >
            {isGenerating ? 'Generating Proposal...' : 'Generate Proposal'}
          </Button>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{currentStage}</span>
                <span className="text-gray-600">{progress}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-gray-500">
                This will take 90-130 seconds. Do not close this page.
              </p>
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
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-bold text-green-900">
                    Proposal Generated Successfully!
                  </div>
                  <div className="text-sm space-y-1">
                    <p>Proposal Number: <strong>{result.proposalNumber}</strong></p>
                    <p>Duration: <strong>{result.metadata?.totalDurationSeconds}s</strong></p>
                    <p>Cost: <strong>£{result.metadata?.totalCost?.toFixed(4)}</strong></p>
                    <p>Tokens: <strong>{result.metadata?.totalTokensUsed?.toLocaleString()}</strong></p>
                  </div>
                  <div className="pt-2 flex gap-3 flex-wrap">
                    <a
                      href={result.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Download PDF
                    </a>
                    <a
                      href={`/api/proposals/${result.proposalId}/view-html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                    >
                      View HTML
                    </a>
                    <a
                      href={result.pdfUrl?.replace('.pdf', '.html')}
                      download
                      className="inline-block px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Download HTML
                    </a>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Debug Info */}
          {result && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                View Full Response (Debug)
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
