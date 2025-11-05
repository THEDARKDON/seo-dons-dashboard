'use client';

/**
 * Test PDF Regeneration Page
 *
 * This page allows you to regenerate PDFs from existing proposal data
 * without triggering new Claude API calls. Perfect for testing design changes!
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { Download, RefreshCw } from 'lucide-react';

interface Proposal {
  id: string;
  proposal_number: string;
  company_name: string;
  selected_package: string;
  status: string;
  created_at: string;
  pdf_url: string | null;
}

export default function TestPDFRegeneratePage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadProposals();
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

  const regeneratePDF = async (proposalId: string) => {
    setRegenerating(proposalId);
    setResult(null);
    setError('');

    try {
      const response = await fetch(`/api/proposals/${proposalId}/regenerate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

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
          {/* Success Message */}
          {result && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-bold text-green-900">
                    PDF Regenerated Successfully!
                  </div>
                  <div className="text-sm space-y-1">
                    <p>Proposal: <strong>{result.proposalNumber}</strong></p>
                    <p>Generation Time: <strong>{result.generationTime}s</strong></p>
                    <p className="text-green-700">Cost: <strong>£0.00</strong> (No API calls!)</p>
                  </div>
                  <div className="pt-2">
                    <a
                      href={result.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4" />
                      Download New PDF
                    </a>
                  </div>
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

          {/* Info Box */}
          <Alert>
            <AlertDescription>
              <strong>How it works:</strong> Click &ldquo;Regenerate PDF&rdquo; to create a new PDF using
              the existing proposal content from the database. No research or content generation
              happens - just PDF rendering. Use this to test design changes without spending money!
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
                        onClick={() => regeneratePDF(proposal.id)}
                        disabled={regenerating === proposal.id}
                        size="sm"
                        className="gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${regenerating === proposal.id ? 'animate-spin' : ''}`} />
                        {regenerating === proposal.id ? 'Regenerating...' : 'Regenerate PDF'}
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
