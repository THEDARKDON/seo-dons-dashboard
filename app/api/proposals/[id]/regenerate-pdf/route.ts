/**
 * Regenerate PDF from Existing Proposal Data
 *
 * POST /api/proposals/[id]/regenerate-pdf
 *
 * This endpoint regenerates the PDF for an existing proposal using the
 * stored content_sections data from the database. No Claude API calls
 * are made, so it's completely free to use for testing PDF designs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { generateProposalPDF, getProposalFilename, validateProposalContent } from '@/lib/pdf/generate';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseServer = await createClient();
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ========================================================================
    // 2. FETCH EXISTING PROPOSAL
    // ========================================================================
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

    // Check if proposal has content_sections
    if (!proposal.content_sections) {
      return NextResponse.json(
        { error: 'Proposal has no content data. Please generate a new proposal.' },
        { status: 400 }
      );
    }

    console.log('[Regenerate PDF] Regenerating PDF for proposal:', proposal.proposal_number);
    console.log('[Regenerate PDF] Company:', proposal.company_name);

    // ========================================================================
    // 3. VALIDATE CONTENT
    // ========================================================================
    try {
      validateProposalContent(proposal.content_sections);
    } catch (validationError) {
      return NextResponse.json(
        {
          error: 'Invalid proposal content',
          details: validationError instanceof Error ? validationError.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // 4. GENERATE NEW PDF
    // ========================================================================
    const startTime = Date.now();
    const pdfBuffer = await generateProposalPDF(proposal.content_sections);
    const generationTime = Math.round((Date.now() - startTime) / 1000);

    console.log(`[Regenerate PDF] PDF generated in ${generationTime}s`);

    // ========================================================================
    // 5. UPLOAD NEW PDF TO STORAGE
    // ========================================================================
    const filename = getProposalFilename(
      proposal.company_name,
      proposal.proposal_number
    );

    // Delete old PDF if exists
    const oldPath = `${proposal.id}/${filename}`;
    await supabaseServer.storage
      .from('proposals')
      .remove([oldPath]);

    // Upload new PDF
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('proposals')
      .upload(oldPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseServer.storage
      .from('proposals')
      .getPublicUrl(oldPath);

    const pdfUrl = urlData.publicUrl;

    // ========================================================================
    // 6. UPDATE PROPOSAL RECORD
    // ========================================================================
    const { error: updateError } = await supabaseServer
      .from('proposals')
      .update({
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposal.id);

    if (updateError) {
      throw new Error(`Failed to update proposal: ${updateError.message}`);
    }

    // Log activity
    await supabaseServer.from('proposal_activities').insert({
      proposal_id: proposal.id,
      activity_type: 'edited',
      description: `PDF regenerated in ${generationTime}s (design update)`,
      user_id: user.id,
    });

    // ========================================================================
    // 7. RETURN SUCCESS
    // ========================================================================
    return NextResponse.json({
      success: true,
      proposalId: proposal.id,
      proposalNumber: proposal.proposal_number,
      pdfUrl,
      generationTime,
      message: 'PDF regenerated successfully from existing content',
    });

  } catch (error) {
    console.error('[Regenerate PDF] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to regenerate PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
