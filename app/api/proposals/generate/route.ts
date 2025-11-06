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
}

export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION & AUTHORIZATION
    // ========================================================================
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Supabase user from Clerk ID
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
    // 2. PARSE & VALIDATE REQUEST
    // ========================================================================
    const body: GenerateProposalRequest = await request.json();

    if (!body.customerId || !body.packageTier) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, packageTier' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. FETCH CUSTOMER DATA
    // ========================================================================
    const { data: customer, error: customerError } = await supabaseServer
      .from('customers')
      .select('*')
      .eq('id', body.customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // ========================================================================
    // 4. VALIDATE PROPOSAL REQUEST
    // ========================================================================
    const proposalRequest = {
      companyName: customer.company || `${customer.first_name} ${customer.last_name}`,
      website: customer.website,
      industry: customer.industry,
      location: [customer.city, customer.state, customer.country].filter(Boolean).join(', ') || undefined,
      packageTier: body.packageTier,
      contactName: body.contactName || `${customer.first_name} ${customer.last_name}`,
      customInstructions: body.customInstructions,

      // Additional customer context for personalized proposals
      jobTitle: customer.job_title,
      phoneNumber: customer.phone,
      email: customer.email,
      linkedInUrl: customer.linkedin_url,
      notes: customer.notes, // SDR notes - critical for personalization
      address: customer.address,
      postalCode: customer.postal_code,
    };

    const validation = validateProposalRequest(proposalRequest);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid proposal request', details: validation.errors },
        { status: 400 }
      );
    }

    // ========================================================================
    // 5. CREATE PROPOSAL RECORD (STATUS: GENERATING)
    // ========================================================================
    const companyName = customer.company || `${customer.first_name} ${customer.last_name}`;
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
      })
      .select()
      .single();

    if (proposalError || !proposal) {
      console.error('[Proposal API] Error creating proposal:', proposalError);
      return NextResponse.json(
        { error: 'Failed to create proposal record' },
        { status: 500 }
      );
    }

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
          await sendProgress('Starting proposal generation', 0);

          const result = await generateCompleteProposal(
            proposalRequest,
            sendProgress
          );

          // ================================================================
          // 8. GENERATE HTML ONLY (PDF conversion done separately)
          // ================================================================
          await sendProgress('Generating HTML', 92, 'Creating HTML document...');

          validateProposalContent(result.content);
          const htmlContent = generateProposalHTML(result.content);

          // ================================================================
          // 9. UPLOAD HTML TO STORAGE
          // ================================================================
          await sendProgress('Uploading HTML', 95, 'Saving to storage...');

          const baseFilename = getProposalFilename(
            customer.company || `${customer.first_name} ${customer.last_name}`,
            proposal.proposal_number
          );

          const htmlFilename = baseFilename.replace('.pdf', '.html');

          // Upload HTML
          const { error: htmlUploadError } = await supabaseServer.storage
            .from('proposals')
            .upload(`${proposal.id}/${htmlFilename}`, htmlContent, {
              contentType: 'text/html; charset=utf-8',
              cacheControl: '3600',
              upsert: false,
            });

          if (htmlUploadError) {
            throw new Error(`Failed to upload HTML: ${htmlUploadError.message}`);
          }

          // Get HTML public URL
          const { data: htmlUrlData } = supabaseServer.storage
            .from('proposals')
            .getPublicUrl(`${proposal.id}/${htmlFilename}`);

          const htmlUrl = htmlUrlData.publicUrl;

          // ================================================================
          // 10. UPDATE PROPOSAL RECORD (STATUS: HTML_READY)
          // ================================================================
          await sendProgress('Finalizing proposal', 99);

          const { error: updateError } = await supabaseServer
            .from('proposals')
            .update({
              status: 'html_ready',
              generation_stage: 'html_ready',
              html_url: htmlUrl,
              html_content: htmlContent,
              html_generated_at: new Date().toISOString(),
              research_data: result.research,
              content_sections: result.content,
              total_tokens_used: result.metadata.totalTokensUsed,
              estimated_cost: result.metadata.totalCost,
              generation_time_seconds: result.metadata.totalDurationSeconds,
            })
            .eq('id', proposal.id);

          if (updateError) {
            throw new Error(`Failed to update proposal: ${updateError.message}`);
          }

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
