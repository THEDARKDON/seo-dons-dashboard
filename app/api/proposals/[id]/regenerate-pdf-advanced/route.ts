/**
 * Advanced PDF/HTML Regeneration Endpoint
 *
 * POST /api/proposals/[id]/regenerate-pdf-advanced
 *
 * This endpoint supports multiple generation methods:
 * 1. Puppeteer (HTML→PDF) - Perfect CSS rendering
 * 2. React-PDF - Original method
 * 3. HTML only - Standalone HTML file
 *
 * Query parameters:
 * - method: 'puppeteer' | 'react-pdf' | 'html' | 'both' (default: 'puppeteer')
 * - fallback: 'true' | 'false' (default: 'true' - auto-fallback if Puppeteer fails)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateProposalPDF as generateReactPDF,
  getProposalFilename,
  validateProposalContent,
} from '@/lib/pdf/generate';
import {
  generateProposalPDFWithPuppeteer,
  generateProposalHTMLStandalone,
  testPuppeteer,
} from '@/lib/pdf/puppeteer-generator';

type GenerationMethod = 'puppeteer' | 'react-pdf' | 'html' | 'both';

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
    // 2. PARSE OPTIONS
    // ========================================================================
    const searchParams = request.nextUrl.searchParams;
    const method = (searchParams.get('method') || 'puppeteer') as GenerationMethod;
    const fallbackEnabled = searchParams.get('fallback') !== 'false';

    console.log(`[Advanced Regenerate] Method: ${method}, Fallback: ${fallbackEnabled}`);

    // ========================================================================
    // 3. FETCH EXISTING PROPOSAL
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

    if (!proposal.content_sections) {
      return NextResponse.json(
        { error: 'Proposal has no content data. Please generate a new proposal.' },
        { status: 400 }
      );
    }

    console.log(`[Advanced Regenerate] Regenerating for: ${proposal.company_name}`);
    console.log(`[Advanced Regenerate] Method: ${method}`);

    // ========================================================================
    // 4. VALIDATE CONTENT
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
    // 5. GENERATE FILES BASED ON METHOD
    // ========================================================================
    const startTime = Date.now();
    let pdfBuffer: Buffer | null = null;
    let htmlContent: string | null = null;
    let generationMethod: string = method;
    let puppeteerPdfBuffer: Buffer | null = null;
    let reactPdfBuffer: Buffer | null = null;

    if (method === 'html') {
      // HTML only
      console.log('[Advanced Regenerate] Generating HTML only...');
      htmlContent = generateProposalHTMLStandalone(proposal.content_sections);
      generationMethod = 'html';

    } else if (method === 'react-pdf') {
      // React-PDF only
      console.log('[Advanced Regenerate] Generating with React-PDF...');
      pdfBuffer = await generateReactPDF(proposal.content_sections);
      generationMethod = 'react-pdf';

    } else if (method === 'puppeteer') {
      // Puppeteer with optional fallback
      console.log('[Advanced Regenerate] Generating with Puppeteer...');
      const result = await generateProposalPDFWithPuppeteer(
        proposal.content_sections,
        fallbackEnabled
      );
      pdfBuffer = result.buffer;
      generationMethod = result.method;

    } else if (method === 'both') {
      // Generate with BOTH methods for comparison
      console.log('[Advanced Regenerate] Generating with BOTH methods for comparison...');

      // Generate HTML
      htmlContent = generateProposalHTMLStandalone(proposal.content_sections);

      // Generate Puppeteer PDF
      try {
        const puppeteerResult = await generateProposalPDFWithPuppeteer(
          proposal.content_sections,
          false // No fallback - we want to test Puppeteer directly
        );
        puppeteerPdfBuffer = puppeteerResult.buffer;
      } catch (puppeteerError) {
        console.error('[Advanced Regenerate] Puppeteer failed:', puppeteerError);
      }

      // Generate React-PDF
      try {
        reactPdfBuffer = await generateReactPDF(proposal.content_sections);
      } catch (reactError) {
        console.error('[Advanced Regenerate] React-PDF failed:', reactError);
      }

      // Use whichever succeeded (prefer Puppeteer)
      pdfBuffer = puppeteerPdfBuffer || reactPdfBuffer;
      generationMethod = puppeteerPdfBuffer ? 'puppeteer' : 'react-pdf';
    }

    const generationTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`[Advanced Regenerate] Generated in ${generationTime}s using ${generationMethod}`);

    // ========================================================================
    // 6. UPLOAD TO STORAGE
    // ========================================================================
    const filename = getProposalFilename(
      proposal.company_name,
      proposal.proposal_number
    );

    let pdfUrl: string | null = null;
    let htmlUrl: string | null = null;
    let puppeteerPdfUrl: string | null = null;
    let reactPdfUrl: string | null = null;

    // Upload main PDF if generated
    if (pdfBuffer) {
      const pdfPath = `${proposal.id}/${filename}`;

      // Delete old PDF
      await supabaseServer.storage
        .from('proposals')
        .remove([pdfPath]);

      // Upload new PDF
      const { data: uploadData, error: uploadError } = await supabaseServer.storage
        .from('proposals')
        .upload(pdfPath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }

      const { data: urlData } = supabaseServer.storage
        .from('proposals')
        .getPublicUrl(pdfPath);

      pdfUrl = urlData.publicUrl;
    }

    // Upload HTML if generated
    if (htmlContent) {
      const htmlFilename = filename.replace('.pdf', '.html');
      const htmlPath = `${proposal.id}/${htmlFilename}`;

      // Delete old HTML
      await supabaseServer.storage
        .from('proposals')
        .remove([htmlPath]);

      // Upload new HTML
      const { error: htmlUploadError } = await supabaseServer.storage
        .from('proposals')
        .upload(htmlPath, htmlContent, {
          contentType: 'text/html',
          upsert: true,
        });

      if (!htmlUploadError) {
        const { data: htmlUrlData } = supabaseServer.storage
          .from('proposals')
          .getPublicUrl(htmlPath);

        htmlUrl = htmlUrlData.publicUrl;
      }
    }

    // Upload both PDFs if in comparison mode
    if (method === 'both') {
      if (puppeteerPdfBuffer) {
        const puppeteerFilename = filename.replace('.pdf', '-puppeteer.pdf');
        const puppeteerPath = `${proposal.id}/${puppeteerFilename}`;

        await supabaseServer.storage
          .from('proposals')
          .remove([puppeteerPath]);

        const { error: puppeteerError } = await supabaseServer.storage
          .from('proposals')
          .upload(puppeteerPath, puppeteerPdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (!puppeteerError) {
          const { data: puppeteerUrlData } = supabaseServer.storage
            .from('proposals')
            .getPublicUrl(puppeteerPath);

          puppeteerPdfUrl = puppeteerUrlData.publicUrl;
        }
      }

      if (reactPdfBuffer) {
        const reactFilename = filename.replace('.pdf', '-react-pdf.pdf');
        const reactPath = `${proposal.id}/${reactFilename}`;

        await supabaseServer.storage
          .from('proposals')
          .remove([reactPath]);

        const { error: reactError } = await supabaseServer.storage
          .from('proposals')
          .upload(reactPath, reactPdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (!reactError) {
          const { data: reactUrlData } = supabaseServer.storage
            .from('proposals')
            .getPublicUrl(reactPath);

          reactPdfUrl = reactUrlData.publicUrl;
        }
      }
    }

    // ========================================================================
    // 7. UPDATE PROPOSAL RECORD
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
      description: `PDF regenerated (${generationMethod}) in ${generationTime}s`,
      user_id: user.id,
    });

    // ========================================================================
    // 8. RETURN SUCCESS
    // ========================================================================
    return NextResponse.json({
      success: true,
      proposalId: proposal.id,
      proposalNumber: proposal.proposal_number,
      method: generationMethod,
      generationTime,
      files: {
        pdf: pdfUrl,
        html: htmlUrl,
        puppeteerPdf: puppeteerPdfUrl,
        reactPdf: reactPdfUrl,
      },
      comparison: method === 'both' ? {
        puppeteerSuccess: !!puppeteerPdfBuffer,
        reactPdfSuccess: !!reactPdfBuffer,
        puppeteerSize: puppeteerPdfBuffer?.length || 0,
        reactPdfSize: reactPdfBuffer?.length || 0,
      } : undefined,
      message: `Successfully generated ${method === 'both' ? 'comparison files' : 'proposal'} using ${generationMethod}`,
    });

  } catch (error) {
    console.error('[Advanced Regenerate] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to regenerate proposal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Test Puppeteer endpoint
 *
 * GET /api/proposals/[id]/regenerate-pdf-advanced?test=true
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const isTest = searchParams.get('test') === 'true';

  if (isTest) {
    const result = await testPuppeteer();
    return NextResponse.json({
      puppeteerTest: result,
      endpoint: 'regenerate-pdf-advanced',
      availableMethods: ['puppeteer', 'react-pdf', 'html', 'both'],
    });
  }

  return NextResponse.json({
    error: 'Use POST to regenerate proposals',
    hint: 'Add ?test=true to test Puppeteer installation',
  }, { status: 405 });
}
