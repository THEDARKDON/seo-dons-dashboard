/**
 * Proposal Generation API Endpoint
 *
 * POST /api/proposals/generate
 *
 * Generates a complete SEO proposal with research, content, and PDF
 * Uses Server-Sent Events (SSE) for real-time progress updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { generateCompleteProposal, validateProposalRequest } from '@/lib/claude/proposal-generator';
import { generateProposalPDF, getProposalFilename, validateProposalContent } from '@/lib/pdf/generate';
import { generateProposalHTML } from '@/lib/pdf/html-template';
import { generateConciseProposalHTML } from '@/lib/pdf/concise-html-template';
import { generateProposalWithTemplate, isValidTemplateStyle, getDefaultTemplateStyle, type TemplateStyle } from '@/lib/pdf/template-selector';

// Vercel serverless function timeout (10 minutes for research + content + PDF generation)
export const maxDuration = 600;

// ============================================================================
// POST - Generate Proposal
// ============================================================================

interface GenerateProposalRequest {
  customerId: string;
  packageTier: 'local' | 'regional' | 'national';
  contactName?: string;
  customInstructions?: string;
  proposalMode?: 'concise' | 'detailed';
  templateStyle?: TemplateStyle; // NEW: 'classic' or 'modern'
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[PROPOSAL API] ========================================');
  console.log('[PROPOSAL API] NEW PROPOSAL GENERATION REQUEST');
  console.log('[PROPOSAL API] Timestamp:', new Date().toISOString());
  console.log('[PROPOSAL API] ========================================');

  try {
    // ========================================================================
    // 1. AUTHENTICATION & AUTHORIZATION
    // ========================================================================
    console.log('[PROPOSAL API] STAGE 1: Authentication & Authorization');
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      console.error('[PROPOSAL API] ❌ Authentication failed: No Clerk user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[PROPOSAL API] ✅ Authenticated - Clerk User ID:', clerkUserId);

    // Get Supabase user from Clerk ID
    const supabaseServer = await createClient();
    console.log('[PROPOSAL API] Fetching Supabase user...');
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      console.error('[PROPOSAL API] ❌ User lookup failed:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log('[PROPOSAL API] ✅ Supabase User ID:', user.id);

    // ========================================================================
    // 2. PARSE & VALIDATE REQUEST
    // ========================================================================
    console.log('[PROPOSAL API] STAGE 2: Request Validation');
    const body: GenerateProposalRequest = await request.json();
    console.log('[PROPOSAL API] Request body:', {
      customerId: body.customerId,
      packageTier: body.packageTier,
      proposalMode: body.proposalMode || 'detailed',
      templateStyle: body.templateStyle || 'classic',
      hasCustomInstructions: !!body.customInstructions,
      contactName: body.contactName,
    });

    if (!body.customerId || !body.packageTier) {
      console.error('[PROPOSAL API] ❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: customerId, packageTier' },
        { status: 400 }
      );
    }
    console.log('[PROPOSAL API] ✅ Request validation passed');

    // ========================================================================
    // 3. FETCH CUSTOMER DATA (including reference images)
    // ========================================================================
    console.log('[PROPOSAL API] STAGE 3: Customer Data Fetch');
    console.log('[PROPOSAL API] Fetching customer ID:', body.customerId);
    const { data: customer, error: customerError} = await supabaseServer
      .from('customers')
      .select('*')
      .eq('id', body.customerId)
      .single();

    if (customerError || !customer) {
      console.error('[PROPOSAL API] ❌ Customer fetch failed:', customerError);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    console.log('[PROPOSAL API] ✅ Customer loaded:', {
      company: customer.company,
      website: customer.website,
      industry: customer.industry,
      location: `${customer.city}, ${customer.state}, ${customer.country}`,
      hasNotes: !!customer.notes,
      hasReferenceImages: (customer.reference_images || []).length > 0,
    });

    // ========================================================================
    // 4. VALIDATE PROPOSAL REQUEST
    // ========================================================================
    console.log('[PROPOSAL API] STAGE 4: Proposal Request Validation');
    const proposalRequest = {
      companyName: customer.company || `${customer.first_name} ${customer.last_name}`,
      website: customer.website,
      industry: customer.industry,
      location: [customer.city, customer.state, customer.country].filter(Boolean).join(', ') || undefined,
      packageTier: body.packageTier,
      contactName: body.contactName || `${customer.first_name} ${customer.last_name}`,
      customInstructions: body.customInstructions,
      proposalMode: body.proposalMode || 'detailed', // Default to detailed if not specified

      // Additional customer context for personalized proposals
      jobTitle: customer.job_title,
      phoneNumber: customer.phone,
      email: customer.email,
      linkedInUrl: customer.linkedin_url,
      notes: customer.notes, // SDR notes - critical for personalization
      referenceImages: customer.reference_images || [], // SEMrush screenshots, competitor analysis, etc.
      address: customer.address,
      postalCode: customer.postal_code,

      // Business metrics for accurate ROI calculations
      averageDealSize: customer.average_deal_size,
      profitPerDeal: customer.profit_per_deal,
      conversionRate: customer.conversion_rate,
    };

    const validation = validateProposalRequest(proposalRequest);
    if (!validation.valid) {
      console.error('[PROPOSAL API] ❌ Proposal request validation failed:', validation.errors);
      return NextResponse.json(
        { error: 'Invalid proposal request', details: validation.errors },
        { status: 400 }
      );
    }
    console.log('[PROPOSAL API] ✅ Proposal request validated');

    // ========================================================================
    // 5. CREATE PROPOSAL RECORD (STATUS: GENERATING)
    // ========================================================================
    console.log('[PROPOSAL API] STAGE 5: Creating Proposal Record');
    const companyName = customer.company || `${customer.first_name} ${customer.last_name}`;

    // Validate and set template style
    const templateStyle = body.templateStyle && isValidTemplateStyle(body.templateStyle)
      ? body.templateStyle
      : getDefaultTemplateStyle();

    console.log('[PROPOSAL API] Template configuration:', {
      templateStyle,
      proposalMode: body.proposalMode || 'detailed',
    });

    const { data: proposal, error: proposalError } = await supabaseServer
      .from('proposals')
      .insert({
        customer_id: body.customerId,
        created_by: user.id,
        status: 'generating',
        title: `${companyName} SEO Investment Strategy & Growth Plan`,
        company_name: companyName,
        company_website: customer.website,
        company_industry: customer.industry,
        selected_package: body.packageTier,
        proposal_mode: body.proposalMode || 'detailed',
        template_style: templateStyle, // NEW: Save template style choice
      })
      .select()
      .single();

    if (proposalError || !proposal) {
      console.error('[PROPOSAL API] ❌ Proposal creation failed:', proposalError);
      return NextResponse.json(
        { error: 'Failed to create proposal record' },
        { status: 500 }
      );
    }
    console.log('[PROPOSAL API] ✅ Proposal record created:', {
      id: proposal.id,
      proposalNumber: proposal.proposal_number,
      status: proposal.status,
    });

    // Log activity
    await supabaseServer.from('proposal_activities').insert({
      proposal_id: proposal.id,
      activity_type: 'created',
      description: 'Proposal generation started',
      user_id: user.id,
    });

    // ========================================================================
    // 6. SETUP SERVER-SENT EVENTS (SSE) FOR PROGRESS STREAMING
    // ========================================================================
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Progress callback for SSE updates
          const sendProgress = async (stage: string, progress: number, details?: string) => {
            const data = JSON.stringify({ stage, progress, details });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          };

          // ================================================================
          // 7. GENERATE PROPOSAL (RESEARCH + CONTENT)
          // ================================================================
          console.log('[PROPOSAL API] STAGE 7: Generating Research & Content');
          await sendProgress('Starting proposal generation', 0);

          const result = await generateCompleteProposal(
            proposalRequest,
            sendProgress
          );

          console.log('[PROPOSAL API] ✅ Research & Content generated:', {
            hasResearch: !!result.research,
            hasContent: !!result.content,
            totalTokens: result.metadata.totalTokensUsed,
            totalCost: result.metadata.totalCost,
            durationSeconds: result.metadata.totalDurationSeconds,
          });

          // ================================================================
          // 8. GENERATE HTML USING SELECTED TEMPLATE
          // ================================================================
          console.log('[PROPOSAL API] STAGE 8: HTML Generation');
          await sendProgress('Generating HTML', 92, `Creating ${templateStyle} template...`);

          // Generate appropriate HTML based on proposal mode and template style
          const isConciseContent = body.proposalMode === 'concise';

          console.log('[PROPOSAL API] HTML generation config:', {
            templateStyle,
            isConcise: isConciseContent,
            companyName,
            hasResearch: !!result.research,
            hasEnhancedResearch: !!result.research?.enhancedResearch,
            keywordCount: result.research?.enhancedResearch?.keywords?.length || 0,
            contentOpportunityCount: result.research?.enhancedResearch?.contentOpportunities?.length || 0,
            locationOpportunityCount: result.research?.enhancedResearch?.locationOpportunities?.length || 0,
          });

          // Only validate detailed content (concise content has different structure)
          if (!isConciseContent) {
            console.log('[PROPOSAL API] Validating detailed content structure...');
            validateProposalContent(result.content as any);
            console.log('[PROPOSAL API] ✅ Content validation passed');
          }

          // Use template selector to generate HTML with chosen template
          console.log('[PROPOSAL API] Calling generateProposalWithTemplate...');
          let htmlContent: string;
          try {
            htmlContent = generateProposalWithTemplate(
              result.content as any,
              templateStyle,
              companyName,
              result.research
            );
            console.log('[PROPOSAL API] ✅ HTML generated successfully:', {
              htmlLength: htmlContent.length,
              containsExecutiveSummary: htmlContent.includes('Executive Summary'),
              containsKeywordRanking: htmlContent.includes('Keyword Ranking Analysis'),
              containsContentOpportunities: htmlContent.includes('Content Opportunities'),
              containsLocationOpportunities: htmlContent.includes('Location Opportunities'),
            });
          } catch (htmlError) {
            console.error('[PROPOSAL API] ❌ HTML generation failed:', {
              error: htmlError,
              message: htmlError instanceof Error ? htmlError.message : 'Unknown error',
              stack: htmlError instanceof Error ? htmlError.stack : undefined,
            });
            throw htmlError;
          }

          // ================================================================
          // 9. UPLOAD HTML TO STORAGE
          // ================================================================
          console.log('[PROPOSAL API] STAGE 9: HTML Upload');
          await sendProgress('Uploading HTML', 95, 'Saving to storage...');

          const baseFilename = getProposalFilename(
            customer.company || `${customer.first_name} ${customer.last_name}`,
            proposal.proposal_number
          );

          const htmlFilename = baseFilename.replace('.pdf', '.html');
          console.log('[PROPOSAL API] HTML filename:', htmlFilename);

          // Upload HTML - Add UTF-8 BOM and convert to Buffer to ensure proper encoding
          // The BOM (Byte Order Mark) tells browsers/editors this is UTF-8
          const utf8Bom = '\uFEFF';
          const htmlWithBom = utf8Bom + htmlContent;
          const htmlBuffer = Buffer.from(htmlWithBom, 'utf-8');

          console.log('[PROPOSAL API] Uploading to storage:', {
            bucket: 'proposals',
            path: `${proposal.id}/${htmlFilename}`,
            sizeBytes: htmlBuffer.length,
          });

          const { error: htmlUploadError } = await supabaseServer.storage
            .from('proposals')
            .upload(`${proposal.id}/${htmlFilename}`, htmlBuffer, {
              contentType: 'text/html; charset=utf-8',
              cacheControl: '3600',
              upsert: false,
            });

          if (htmlUploadError) {
            console.error('[PROPOSAL API] ❌ HTML upload failed:', htmlUploadError);
            throw new Error(`Failed to upload HTML: ${htmlUploadError.message}`);
          }

          // Get HTML public URL
          const { data: htmlUrlData } = supabaseServer.storage
            .from('proposals')
            .getPublicUrl(`${proposal.id}/${htmlFilename}`);

          const htmlUrl = htmlUrlData.publicUrl;
          console.log('[PROPOSAL API] ✅ HTML uploaded successfully:', htmlUrl);

          // ================================================================
          // 10. UPDATE PROPOSAL RECORD (STATUS: HTML_READY)
          // ================================================================
          console.log('[PROPOSAL API] STAGE 10: Database Update');
          await sendProgress('Finalizing proposal', 99);

          const { error: updateError } = await supabaseServer
            .from('proposals')
            .update({
              status: 'html_ready',
              generation_stage: 'html_ready',
              html_url: htmlUrl,
              html_content: htmlContent, // Store as string - PostgreSQL TEXT type handles UTF-8
              html_generated_at: new Date().toISOString(),
              research_data: result.research, // JSONB stores UTF-8 correctly
              content_sections: result.content, // JSONB stores UTF-8 correctly
              total_tokens_used: result.metadata.totalTokensUsed,
              estimated_cost: result.metadata.totalCost,
              generation_time_seconds: result.metadata.totalDurationSeconds,
            })
            .eq('id', proposal.id);

          if (updateError) {
            console.error('[PROPOSAL API] ❌ Database update failed:', updateError);
            throw new Error(`Failed to update proposal: ${updateError.message}`);
          }
          console.log('[PROPOSAL API] ✅ Proposal record updated to html_ready');

          // Log completion
          await supabaseServer.from('proposal_activities').insert({
            proposal_id: proposal.id,
            activity_type: 'created',
            description: `HTML proposal generated successfully in ${result.metadata.totalDurationSeconds}s. Ready for review and PDF conversion.`,
            user_id: user.id,
          });

          // ================================================================
          // 11. SEND COMPLETION EVENT
          // ================================================================
          const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log('[PROPOSAL API] ========================================');
          console.log('[PROPOSAL API] ✅ PROPOSAL GENERATION COMPLETE');
          console.log('[PROPOSAL API] Total Duration:', totalDuration, 'seconds');
          console.log('[PROPOSAL API] Proposal ID:', proposal.id);
          console.log('[PROPOSAL API] Proposal Number:', proposal.proposal_number);
          console.log('[PROPOSAL API] HTML URL:', htmlUrl);
          console.log('[PROPOSAL API] ========================================');

          await sendProgress('Complete', 100, 'HTML proposal ready for review!');

          const completionData = JSON.stringify({
            complete: true,
            proposalId: proposal.id,
            proposalNumber: proposal.proposal_number,
            htmlUrl,
            status: 'html_ready',
            metadata: result.metadata,
          });

          controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));
          controller.close();
        } catch (error) {
          console.error('[Proposal API] Error during generation:', error);

          // Update proposal status to error
          await supabaseServer
            .from('proposals')
            .update({
              status: 'error',
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', proposal.id);

          // Log error (using 'edited' as closest activity type since 'error' doesn't exist)
          await supabaseServer.from('proposal_activities').insert({
            proposal_id: proposal.id,
            activity_type: 'edited',
            description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            user_id: user.id,
          });

          // Send error event
          const errorData = JSON.stringify({
            error: true,
            message: error instanceof Error ? error.message : 'Unknown error',
          });

          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    // ========================================================================
    // RETURN SSE STREAM
    // ========================================================================
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Proposal API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
