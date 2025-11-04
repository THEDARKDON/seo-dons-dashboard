/**
 * Test endpoint for Claude API integration
 *
 * This endpoint performs a simple company analysis to verify:
 * 1. Claude API key is configured correctly
 * 2. Extended thinking is working
 * 3. JSON extraction from responses works
 * 4. Cost calculation is accurate
 *
 * Usage: POST /api/test-claude
 * Body: { "companyName": "Example Ltd", "website": "https://example.com" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { performDeepResearch } from '@/lib/claude/research-agent';
import { isClaudeConfigured, formatTokenCount } from '@/lib/claude/client';
import { formatClaudeError } from '@/lib/claude/utils';

export async function POST(request: NextRequest) {
  try {
    // Check if Claude is configured
    if (!isClaudeConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Claude API key is not configured. Please set ANTHROPIC_API_KEY in your environment variables.',
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { companyName, website, industry, location, packageTier } = body;

    if (!companyName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company name is required',
        },
        { status: 400 }
      );
    }

    console.log(`[Test Claude] Starting research for: ${companyName}`);
    const startTime = Date.now();

    // Track progress
    const progressLog: Array<{ stage: string; progress: number; timestamp: number }> = [];

    const onProgress = async (stage: string, progress: number) => {
      const timestamp = Date.now() - startTime;
      progressLog.push({ stage, progress, timestamp });
      console.log(`[Test Claude] ${progress}% - ${stage} (${timestamp}ms)`);
    };

    // Perform research
    const result = await performDeepResearch(
      {
        companyName,
        website,
        industry,
        location,
        packageTier: packageTier || 'local',
      },
      onProgress
    );

    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);

    console.log(`[Test Claude] Research completed in ${durationSeconds}s`);
    console.log(`[Test Claude] Total tokens: ${formatTokenCount(result.totalTokensUsed)}`);
    console.log(`[Test Claude] Thinking tokens: ${formatTokenCount(result.thinkingTokensUsed)}`);
    console.log(`[Test Claude] Estimated cost: £${result.estimatedCost.toFixed(4)}`);

    // Return results
    return NextResponse.json({
      success: true,
      data: {
        research: result,
        performance: {
          durationSeconds,
          totalTokens: result.totalTokensUsed,
          thinkingTokens: result.thinkingTokensUsed,
          estimatedCost: result.estimatedCost,
          progressLog,
        },
      },
    });
  } catch (error: any) {
    console.error('[Test Claude] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: formatClaudeError(error),
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for quick health check
export async function GET() {
  const configured = isClaudeConfigured();

  return NextResponse.json({
    success: true,
    configured,
    message: configured
      ? 'Claude API is configured and ready'
      : 'Claude API key is not configured',
  });
}
