/**
 * Enhanced PDF Generation Endpoint
 *
 * POST /api/proposals/[id]/generate-enhanced-pdf
 *
 * Generates a high-fidelity PDF from proposal HTML using Puppeteer
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { generateEnhancedPDF, validatePDF } from '@/lib/pdf/enhanced-pdf-generator';
import { getProposalFilename } from '@/lib/pdf/generate';

export const maxDuration = 60; // 1 minute timeout for PDF generation

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // 2. Get user from database
    const supabaseServer = await createClient();
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // 3. Get proposal with content
    const { data: proposal, error: proposalError } = await supabaseServer
      .from('proposals')
      .select('*, customers(*)')
      .eq('id', id)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // 4. Parse proposal content
    let content;
    let research = null;

    try {
      content = typeof proposal.proposal_content === 'string'
        ? JSON.parse(proposal.proposal_content)
        : proposal.proposal_content;

      if (proposal.research_data) {
        research = typeof proposal.research_data === 'string'
          ? JSON.parse(proposal.research_data)
          : proposal.research_data;
      }
    } catch (parseError) {
      console.error('[Enhanced PDF] Error parsing proposal data:', parseError);
      return NextResponse.json(
        { error: 'Invalid proposal data format' },
        { status: 400 }
      );
    }

    // 5. Generate enhanced PDF
    console.log('[Enhanced PDF] Starting PDF generation for proposal:', id);
    const startTime = Date.now();

    try {
      const pdfBuffer = await generateEnhancedPDF(content, research, {
        debug: process.env.NODE_ENV === 'development',
        waitForSelectors: ['.page', '.chart-container'], // Wait for key elements
        pdfCSS: `
          /* Additional custom styles for this specific proposal */
          .page { background: white !important; }
          .chart-container { min-height: 200px; }
        `
      });

      // Validate PDF
      if (!validatePDF(pdfBuffer)) {
        throw new Error('Generated PDF is invalid');
      }

      const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[Enhanced PDF] PDF generated successfully in ${generationTime}s`);

      // 6. Upload to storage
      const filename = getProposalFilename(
        proposal.company_name,
        proposal.proposal_number
      );

      const { error: uploadError } = await supabaseServer.storage
        .from('proposals')
        .upload(`${proposal.id}/${filename}`, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: true, // Replace existing PDF
        });

      if (uploadError) {
        console.error('[Enhanced PDF] Upload error:', uploadError);
        throw uploadError;
      }

      // 7. Update proposal record
      const { error: updateError } = await supabaseServer
        .from('proposals')
        .update({
          pdf_url: `${proposal.id}/${filename}`,
          status: 'completed',
          pdf_generated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('[Enhanced PDF] Database update error:', updateError);
        throw updateError;
      }

      // 8. Log activity
      await supabaseServer.from('proposal_activities').insert({
        proposal_id: proposal.id,
        activity_type: 'edited',
        description: `Enhanced PDF generated successfully in ${generationTime}s`,
        user_id: user.id,
      });

      // 9. Get public URL for the PDF
      const { data: { publicUrl } } = supabaseServer.storage
        .from('proposals')
        .getPublicUrl(`${proposal.id}/${filename}`);

      return NextResponse.json({
        success: true,
        pdfUrl: publicUrl,
        filename: filename,
        generationTime: generationTime,
        size: pdfBuffer.length
      });

    } catch (pdfError: any) {
      console.error('[Enhanced PDF] Generation error:', pdfError);

      // Update proposal status to indicate error
      await supabaseServer
        .from('proposals')
        .update({ status: 'error' })
        .eq('id', id);

      // Log error activity
      await supabaseServer.from('proposal_activities').insert({
        proposal_id: proposal.id,
        activity_type: 'edited',
        description: `PDF generation error: ${pdfError.message}`,
        user_id: user.id,
      });

      return NextResponse.json(
        {
          error: 'PDF generation failed',
          details: pdfError.message,
          stack: process.env.NODE_ENV === 'development' ? pdfError.stack : undefined
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Enhanced PDF] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}