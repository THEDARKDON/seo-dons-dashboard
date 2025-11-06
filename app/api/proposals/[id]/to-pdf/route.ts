/**
 * Proposal PDF Conversion API Endpoint
 *
 * POST /api/proposals/[id]/to-pdf
 *
 * Converts HTML proposal to PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { getProposalFilename } from '@/lib/pdf/generate';
import { generateProposalPDFWithPuppeteer } from '@/lib/pdf/puppeteer-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseServer = await createClient();
    const { data: user } = await supabaseServer
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch proposal
    const { data: proposal, error: proposalError } = await supabaseServer
      .from('proposals')
      .select('*')
      .eq('id', params.id)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Check if HTML is ready
    if (proposal.status !== 'html_ready' && proposal.generation_stage !== 'html_ready') {
      return NextResponse.json(
        { error: 'Proposal HTML not ready. Generate HTML first.' },
        { status: 400 }
      );
    }

    if (!proposal.content_sections) {
      return NextResponse.json(
        { error: 'No content found to convert to PDF' },
        { status: 400 }
      );
    }

    // Generate PDF from content using Puppeteer (HTML→PDF for perfect design match)
    const { buffer: pdfBuffer, method } = await generateProposalPDFWithPuppeteer(
      proposal.content_sections
    );

    console.log(`[PDF Conversion] Generated PDF using ${method}`);

    // Get customer for filename
    const { data: customer } = await supabaseServer
      .from('customers')
      .select('company, first_name, last_name')
      .eq('id', proposal.customer_id)
      .single();

    const companyName = customer?.company ||
      `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() ||
      'Customer';

    const pdfFilename = getProposalFilename(companyName, proposal.proposal_number);

    // Upload PDF to storage
    const { error: pdfUploadError } = await supabaseServer.storage
      .from('proposals')
      .upload(`${proposal.id}/${pdfFilename}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
      });

    if (pdfUploadError) {
      console.error('[PDF Conversion] Upload failed:', pdfUploadError);
      return NextResponse.json(
        { error: 'Failed to upload PDF' },
        { status: 500 }
      );
    }

    // Get PDF public URL
    const { data: pdfUrlData } = supabaseServer.storage
      .from('proposals')
      .getPublicUrl(`${proposal.id}/${pdfFilename}`);

    const pdfUrl = pdfUrlData.publicUrl;

    // Update proposal record
    const { error: updateError } = await supabaseServer
      .from('proposals')
      .update({
        status: 'ready',
        generation_stage: 'pdf_ready',
        pdf_url: pdfUrl,
        pdf_generated_at: new Date().toISOString(),
      })
      .eq('id', proposal.id);

    if (updateError) {
      console.error('[PDF Conversion] Update failed:', updateError);
      return NextResponse.json(
        { error: 'Failed to update proposal status' },
        { status: 500 }
      );
    }

    // Log activity
    await supabaseServer.from('proposal_activities').insert({
      proposal_id: proposal.id,
      activity_type: 'pdf_created',
      description: 'Proposal converted to PDF successfully',
      user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      pdfUrl,
      message: 'PDF generated successfully',
    });
  } catch (error) {
    console.error('[PDF Conversion] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
