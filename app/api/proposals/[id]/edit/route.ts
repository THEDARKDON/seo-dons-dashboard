/**
 * Proposal Edit API Endpoint
 *
 * POST /api/proposals/[id]/edit
 *
 * Regenerates proposal HTML content based on AI edit prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { generateProposalHTML } from '@/lib/pdf/html-template';
import { sanitizeObjectEncoding } from '@/lib/utils/encoding';
import Anthropic from '@anthropic-ai/sdk';

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

    // Parse request
    const { editPrompt } = await request.json();
    if (!editPrompt) {
      return NextResponse.json(
        { error: 'editPrompt is required' },
        { status: 400 }
      );
    }

    // Fetch existing proposal
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

    // Must have existing content to edit
    if (!proposal.content_sections) {
      return NextResponse.json(
        { error: 'No content to edit. Generate the proposal first.' },
        { status: 400 }
      );
    }

    // Call Claude to edit the content
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const editSystemPrompt = `You are an expert SEO proposal editor. You will receive:
1. Existing proposal content (JSON)
2. Edit instructions from the user

Your task:
- Apply the requested edits to the proposal content
- Maintain the exact JSON structure
- Keep all fields that aren't being edited
- Ensure the edited content is professional and cohesive
- Preserve the A1 Mobility style (direct, data-driven, provocative)

Return ONLY the updated JSON, nothing else.`;

    const editUserPrompt = `Here is the current proposal content:

\`\`\`json
${JSON.stringify(proposal.content_sections, null, 2)}
\`\`\`

EDIT INSTRUCTIONS:
${editPrompt}

Return the updated proposal content in the exact same JSON structure.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.7,
      system: editSystemPrompt,
      messages: [
        {
          role: 'user',
          content: editUserPrompt,
        },
      ],
    });

    // Extract edited content
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response
    let editedContent;
    try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : responseText;
      editedContent = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('[Edit API] Failed to parse edited content:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse edited content from AI' },
        { status: 500 }
      );
    }

    // CRITICAL: Sanitize edited content to fix UTF-8 encoding corruption
    console.log('[Edit API] Sanitizing edited content encoding...');
    const sanitizedContent = sanitizeObjectEncoding(editedContent);

    // Generate new HTML with sanitized content
    const newHtmlContent = generateProposalHTML(sanitizedContent);

    // Upload new HTML to storage
    const htmlFilename = `${proposal.proposal_number.replace('P-', '')}.html`;

    // Add UTF-8 BOM and convert to Buffer to ensure proper encoding
    const utf8Bom = '\uFEFF';
    const htmlWithBom = utf8Bom + newHtmlContent;
    const htmlBuffer = Buffer.from(htmlWithBom, 'utf-8');

    const { error: uploadError} = await supabaseServer.storage
      .from('proposals')
      .upload(`${proposal.id}/${htmlFilename}`, htmlBuffer, {
        contentType: 'text/html; charset=utf-8',
        cacheControl: '3600',
        upsert: true, // Overwrite existing
      });

    if (uploadError) {
      console.error('[Edit API] Failed to upload HTML:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload edited HTML' },
        { status: 500 }
      );
    }

    // Get new HTML URL
    const { data: htmlUrlData } = supabaseServer.storage
      .from('proposals')
      .getPublicUrl(`${proposal.id}/${htmlFilename}`);

    // Update proposal in database with sanitized content
    const { error: updateError } = await supabaseServer
      .from('proposals')
      .update({
        html_content: newHtmlContent,
        html_url: htmlUrlData.publicUrl,
        content_sections: sanitizedContent,
        html_generated_at: new Date().toISOString(),
      })
      .eq('id', proposal.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update proposal' },
        { status: 500 }
      );
    }

    // Log activity
    await supabaseServer.from('proposal_activities').insert({
      proposal_id: proposal.id,
      activity_type: 'edited',
      description: `Proposal edited with AI: ${editPrompt.substring(0, 100)}${editPrompt.length > 100 ? '...' : ''}`,
      user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      proposalId: proposal.id,
      htmlUrl: htmlUrlData.publicUrl,
      message: 'Proposal edited successfully',
    });
  } catch (error) {
    console.error('[Edit API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
