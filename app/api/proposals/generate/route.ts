/**
 * Proposal Generation API Endpoint
 *
 * POST /api/proposals/generate
 *
 * Generates a complete SEO proposal with research, content, and PDF
 * Uses Server-Sent Events (SSE) for real-time progress updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCompleteProposal, validateProposalRequest } from '@/lib/claude/proposal-generator';
import { generateProposalPDF, getProposalFilename, validateProposalContent } from '@/lib/pdf/generate';
import { supabase } from '@/lib/supabase/client';

// Vercel serverless function timeout (5 minutes)
export const maxDuration = 300;

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
    const supabaseServer = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const { data: customer, error: customerError } = await supabase
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
      companyName: customer.company_name,
      website: customer.website,
      industry: customer.industry,
      location: customer.location,
      packageTier: body.packageTier,
      contactName: body.contactName || customer.contact_name,
      customInstructions: body.customInstructions,
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
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        customer_id: body.customerId,
        created_by: user.id,
        status: 'generating',
        package_tier: body.packageTier,
        company_name: customer.company_name,
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
    await supabase.from('proposal_activities').insert({
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
          // 8. GENERATE PDF
          // ================================================================
          await sendProgress('Generating PDF', 95, 'Creating document...');

          validateProposalContent(result.content);
          const pdfBuffer = await generateProposalPDF(result.content);

          // ================================================================
          // 9. UPLOAD PDF TO STORAGE
          // ================================================================
          await sendProgress('Uploading PDF', 97, 'Saving to storage...');

          const filename = getProposalFilename(
            customer.company_name,
            proposal.proposal_number
          );

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('proposals')
            .upload(`${proposal.id}/${filename}`, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: false,
            });

          if (uploadError) {
            throw new Error(`Failed to upload PDF: ${uploadError.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('proposals')
            .getPublicUrl(`${proposal.id}/${filename}`);

          const pdfUrl = urlData.publicUrl;

          // ================================================================
          // 10. UPDATE PROPOSAL RECORD (STATUS: READY)
          // ================================================================
          await sendProgress('Finalizing proposal', 99);

          const { error: updateError } = await supabase
            .from('proposals')
            .update({
              status: 'ready',
              pdf_url: pdfUrl,
              research_data: result.research,
              content_data: result.content,
              total_tokens: result.metadata.totalTokensUsed,
              estimated_cost: result.metadata.totalCost,
              generation_duration: result.metadata.totalDurationSeconds,
            })
            .eq('id', proposal.id);

          if (updateError) {
            throw new Error(`Failed to update proposal: ${updateError.message}`);
          }

          // Log completion
          await supabase.from('proposal_activities').insert({
            proposal_id: proposal.id,
            activity_type: 'generated',
            description: `Proposal generated successfully in ${result.metadata.totalDurationSeconds}s`,
            user_id: user.id,
          });

          // ================================================================
          // 11. SEND COMPLETION EVENT
          // ================================================================
          await sendProgress('Complete', 100, 'Proposal ready!');

          const completionData = JSON.stringify({
            complete: true,
            proposalId: proposal.id,
            proposalNumber: proposal.proposal_number,
            pdfUrl,
            metadata: result.metadata,
          });

          controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));
          controller.close();
        } catch (error) {
          console.error('[Proposal API] Error during generation:', error);

          // Update proposal status to error
          await supabase
            .from('proposals')
            .update({
              status: 'error',
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', proposal.id);

          // Log error
          await supabase.from('proposal_activities').insert({
            proposal_id: proposal.id,
            activity_type: 'error',
            description: error instanceof Error ? error.message : 'Unknown error',
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
