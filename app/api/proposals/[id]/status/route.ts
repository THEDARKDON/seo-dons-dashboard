/**
 * Proposal Status API Endpoint
 *
 * GET /api/proposals/[id]/status
 *
 * Returns the current status of a proposal generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
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
    // 2. FETCH PROPOSAL
    // ========================================================================
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', params.id)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // ========================================================================
    // 3. RETURN STATUS
    // ========================================================================
    return NextResponse.json({
      proposalId: proposal.id,
      proposalNumber: proposal.proposal_number,
      status: proposal.status,
      companyName: proposal.company_name,
      packageTier: proposal.package_tier,
      pdfUrl: proposal.pdf_url,
      errorMessage: proposal.error_message,
      metadata: {
        totalTokens: proposal.total_tokens,
        estimatedCost: proposal.estimated_cost,
        generationDuration: proposal.generation_duration,
        createdAt: proposal.created_at,
        updatedAt: proposal.updated_at,
      },
    });
  } catch (error) {
    console.error('[Proposal Status API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
