/**
 * Presentation Mode for HTML Proposals
 *
 * Full-screen, clean view optimized for presenting proposals
 * to clients via screen sharing or projection
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PresentationToolbar } from '@/components/proposals/presentation-toolbar';
import { PresentationContent } from '@/components/proposals/presentation-content';

interface PresentationPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PresentationPageProps): Promise<Metadata> {
  const supabase = await createClient();
  const { data: proposal } = await supabase
    .from('proposals')
    .select('title, company_name, proposal_number')
    .eq('id', params.id)
    .single();

  return {
    title: proposal ? `${proposal.company_name} - Proposal #${proposal.proposal_number}` : 'Proposal Presentation',
  };
}

export default async function PresentationPage({ params }: PresentationPageProps) {
  const supabase = await createClient();

  // Fetch proposal metadata
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, html_url, company_name, proposal_number, pdf_url')
    .eq('id', params.id)
    .single();

  if (error || !proposal) {
    notFound();
  }

  if (!proposal.html_url) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">HTML Not Available</h1>
          <p className="mt-2 text-gray-600">
            This proposal doesn&apos;t have HTML content yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="presentation-mode">
      <PresentationToolbar
        proposalTitle={`${proposal.company_name} - Proposal #${proposal.proposal_number}`}
        pdfUrl={proposal.pdf_url}
      />

      <PresentationContent proposalId={proposal.id} />
    </div>
  );
}
