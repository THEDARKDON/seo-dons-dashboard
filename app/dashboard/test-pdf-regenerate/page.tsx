'use client';

/**
 * Test PDF Regeneration Page
 *
 * This page allows you to regenerate PDFs from existing proposal data
 * without triggering new Claude API calls. Perfect for testing design changes!
 *
 * NEW: Support for multiple generation methods:
 * - Puppeteer (HTML→PDF with perfect CSS)
 * - React-PDF (original method)
 * - HTML only
 * - Both methods for comparison
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { Download, RefreshCw, FileText, Zap, Code } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Proposal {
  id: string;
  proposal_number: string;
  company_name: string;
  selected_package: string;
  status: string;
  created_at: string;
  pdf_url: string | null;
}

type GenerationMethod = 'puppeteer' | 'react-pdf' | 'html' | 'both';

export default function TestPDFRegeneratePage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<GenerationMethod>('puppeteer');
  const [puppeteerTest, setPuppeteerTest] = useState<any>(null);

  useEffect(() => {
    loadProposals();
    testPuppeteerInstallation();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('proposals')
      .select('id, proposal_number, company_name, selected_package, status, created_at, pdf_url')
      .not('content_sections', 'is', null) // Only proposals with content
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading proposals:', error);
      setError('Failed to load proposals');
    } else {
      setProposals(data || []);
    }
    setLoading(false);
  };

  const testPuppeteerInstallation = async () => {
    try {
      // Use any proposal ID for the test - we're just testing the endpoint
      const response = await fetch(`/api/proposals/test/regenerate-pdf-advanced?test=true`);
      const data = await response.json();
      setPuppeteerTest(data.puppeteerTest);
    } catch (err) {
      console.error('Puppeteer test failed:', err);
      setPuppeteerTest({ working: false, error: 'Failed to test' });
    }
  };

  const regeneratePDF = async (proposalId: string, method: GenerationMethod = selectedMethod) => {
    setRegenerating(proposalId);
    setResult(null);
    setError('');

    try {
      const response = await fetch(
        `/api/proposals/${proposalId}/regenerate-pdf-advanced?method=${method}&fallback=true`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate PDF');
      }

      setResult(data);
      // Reload proposals to get updated PDF URL
      await loadProposals();
    } catch (err) {
      console.error('Error regenerating PDF:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRegenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <p>Loading proposals...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Test PDF Regeneration</CardTitle>
          <CardDescription>
            Regenerate PDFs from existing proposal content without making Claude API calls.
            Perfect for testing design changes! 💰 Zero cost per regeneration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Puppeteer Status */}
          {puppeteerTest && (
            <Alert className={puppeteerTest.working ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  {puppeteerTest.working ? (
                    <>
                      <Zap className="h-5 w-5 text-green-600" />
                      <div>
                        <strong className="text-green-900">Puppeteer Ready!</strong>
                        <p className="text-sm text-green-700">
                          Perfect CSS rendering available. Version: {puppeteerTest.version}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Code className="h-5 w-5 text-yellow-600" />
                      <div>
                        <strong className="text-yellow-900">Puppeteer Not Available</strong>
                        <p className="text-sm text-yellow-700">
                          Will automatically fallback to React-PDF. Error: {puppeteerTest.error}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {result && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription>
                <div className="space-y-3">
                  <div className="font-bold text-green-900">
                    Successfully Generated! ({result.method})
                  </div>
                  <div className="text-sm space-y-1">
                    <p>Proposal: <strong>{result.proposalNumber}</strong></p>
                    <p>Method: <strong>{result.method === 'puppeteer' ? 'Puppeteer (Perfect CSS)' : 'React-PDF'}</strong></p>
                    <p>Generation Time: <strong>{result.generationTime}s</strong></p>
                    <p className="text-green-700">Cost: <strong>£0.00</strong> (No API calls!)</p>
                  </div>

                  {/* Download buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {result.files?.pdf && (
                      <a
                        href={result.files.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </a>
                    )}

                    {result.files?.html && (
                      <a
                        href={result.files.html}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
                      >
                        <Code className="h-4 w-4" />
                        View HTML
                      </a>
                    )}

                    {result.files?.puppeteerPdf && (
                      <a
                        href={result.files.puppeteerPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                      >
                        <Zap className="h-3 w-3" />
                        Puppeteer PDF
                      </a>
                    )}

                    {result.files?.reactPdf && (
                      <a
                        href={result.files.reactPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                      >
                        <FileText className="h-3 w-3" />
                        React-PDF
                      </a>
                    )}
                  </div>

                  {/* Comparison results */}
                  {result.comparison && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-semibold mb-1">Comparison Results:</p>
                      <div className="text-xs space-y-1">
                        <p>Puppeteer: {result.comparison.puppeteerSuccess ? '✅ Success' : '❌ Failed'}
                          {result.comparison.puppeteerSuccess && ` (${(result.comparison.puppeteerSize / 1024).toFixed(0)}KB)`}
                        </p>
                        <p>React-PDF: {result.comparison.reactPdfSuccess ? '✅ Success' : '❌ Failed'}
                          {result.comparison.reactPdfSuccess && ` (${(result.comparison.reactPdfSize / 1024).toFixed(0)}KB)`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Generation Method Selector */}
          <Card className="bg-blue-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Generation Method</CardTitle>
              <CardDescription>
                Choose how to generate your proposals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as GenerationMethod)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="puppeteer">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      <div>
                        <div className="font-medium">Puppeteer (Recommended)</div>
                        <div className="text-xs text-gray-600">Perfect CSS rendering, gradients, shadows</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="react-pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">React-PDF (Original)</div>
                        <div className="text-xs text-gray-600">Reliable, but limited CSS support</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-cyan-600" />
                      <div>
                        <div className="font-medium">HTML Only</div>
                        <div className="text-xs text-gray-600">View in browser, manual PDF export</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="font-medium">Both (Comparison)</div>
                        <div className="text-xs text-gray-600">Generate with both methods to compare quality</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="mt-3 text-xs text-gray-600 space-y-1">
                <p><strong>Tip:</strong> Use "Both" mode to compare quality side-by-side!</p>
                <p>Puppeteer automatically falls back to React-PDF if it fails.</p>
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Alert>
            <AlertDescription>
              <strong>How it works:</strong> Select a generation method above, then click "Regenerate"
              to create a new file using the existing proposal content from the database. No research
              or content generation happens - just rendering. Perfect for testing design changes without spending money!
            </AlertDescription>
          </Alert>

          {/* Proposals List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Available Proposals ({proposals.length})</h3>

            {proposals.length === 0 ? (
              <p className="text-gray-600">
                No proposals with content found. Generate a proposal first at{' '}
                <a href="/dashboard/test-proposal" className="text-blue-600 hover:underline">
                  /dashboard/test-proposal
                </a>
              </p>
            ) : (
              <div className="space-y-2">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{proposal.company_name}</div>
                      <div className="text-sm text-gray-600">
                        {proposal.proposal_number} • {proposal.selected_package} package •{' '}
                        {new Date(proposal.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Status: <span className="font-medium">{proposal.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {proposal.pdf_url && (
                        <a
                          href={proposal.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Current PDF
                          </Button>
                        </a>
                      )}

                      <Button
                        onClick={() => regeneratePDF(proposal.id, selectedMethod)}
                        disabled={regenerating === proposal.id}
                        size="sm"
                        className="gap-2"
                      >
                        {selectedMethod === 'puppeteer' && <Zap className={`h-4 w-4 ${regenerating === proposal.id ? 'animate-spin' : ''}`} />}
                        {selectedMethod === 'react-pdf' && <FileText className={`h-4 w-4 ${regenerating === proposal.id ? 'animate-spin' : ''}`} />}
                        {selectedMethod === 'html' && <Code className={`h-4 w-4 ${regenerating === proposal.id ? 'animate-spin' : ''}`} />}
                        {selectedMethod === 'both' && <RefreshCw className={`h-4 w-4 ${regenerating === proposal.id ? 'animate-spin' : ''}`} />}
                        {regenerating === proposal.id ? 'Generating...' : 'Regenerate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
