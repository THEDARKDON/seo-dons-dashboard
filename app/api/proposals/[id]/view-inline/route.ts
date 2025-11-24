/**
 * Inline HTML Proposal Viewer API
 *
 * GET /api/proposals/[id]/view-inline
 *
 * Serves the HTML proposal with inline display for presentation mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // No authentication required - middleware handles public access for this route
    // This endpoint is publicly accessible for presentation mode (/present/*)
    const supabase = await createClient();

    // Get proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Check if HTML exists
    if (!proposal.html_url) {
      return NextResponse.json({ error: 'HTML version not available' }, { status: 404 });
    }

    // Download HTML from storage
    const htmlPath = proposal.html_url.split('/proposals/')[1];
    const { data: htmlData, error: downloadError } = await supabase.storage
      .from('proposals')
      .download(htmlPath);

    if (downloadError || !htmlData) {
      return NextResponse.json(
        { error: 'Failed to load HTML proposal' },
        { status: 500 }
      );
    }

    // Convert blob to text
    const htmlContent = await htmlData.text();

    // Return HTML for inline display (no Content-Disposition attachment)
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, max-age=3600',
        'X-Frame-Options': 'SAMEORIGIN', // Allow iframe from same origin
      },
    });
  } catch (error) {
    console.error('[HTML Inline Viewer] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
