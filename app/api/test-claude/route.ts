/**
 * Test endpoint for Claude API integration with streaming support
 *
 * This endpoint performs company analysis using Server-Sent Events (SSE)
 * to stream progress updates and avoid Vercel timeout issues.
 *
 * Usage: POST /api/test-claude
 * Body: { "companyName": "Example Ltd", "website": "https://example.com" }
 * Returns: SSE stream with progress updates and final results
 */

import { NextRequest } from 'next/server';
import { performDeepResearch } from '@/lib/claude/research-agent';
import { isClaudeConfigured, formatTokenCount } from '@/lib/claude/client';
import { formatClaudeError } from '@/lib/claude/utils';

// Disable body size limit and enable streaming
export const maxDuration = 300; // 5 minutes max (Vercel Pro limit)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if Claude is configured
    if (!isClaudeConfigured()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Claude API key is not configured. Please set ANTHROPIC_API_KEY in your environment variables.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { companyName, website, industry, location, packageTier } = body;

    if (!companyName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Company name is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[Test Claude] Starting research for: ${companyName}`);
    const startTime = Date.now();

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper to send SSE message
          const sendEvent = (event: string, data: any) => {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          };

          // Send initial event
          sendEvent('start', {
            message: 'Starting deep research...',
            timestamp: Date.now() - startTime
          });

          // Progress callback
          const onProgress = async (stage: string, progress: number) => {
            const timestamp = Date.now() - startTime;
            console.log(`[Test Claude] ${progress}% - ${stage} (${timestamp}ms)`);

            sendEvent('progress', {
              stage,
              progress,
              timestamp,
            });
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

          // Send complete event with results
          sendEvent('complete', {
            success: true,
            data: {
              research: result,
              performance: {
                durationSeconds,
                totalTokens: result.totalTokensUsed,
                thinkingTokens: result.thinkingTokensUsed,
                estimatedCost: result.estimatedCost,
              },
            },
          });

          // Close the stream
          controller.close();
        } catch (error: any) {
          console.error('[Test Claude] Error:', error);

          // Send error event
          const message = `event: error\ndata: ${JSON.stringify({
            success: false,
            error: formatClaudeError(error),
            details: error.message || 'Unknown error',
          })}\n\n`;
          controller.enqueue(encoder.encode(message));
          controller.close();
        }
      },
    });

    // Return SSE stream
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('[Test Claude] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: formatClaudeError(error),
        details: error.message || 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// GET endpoint for quick health check
export async function GET() {
  const configured = isClaudeConfigured();

  return new Response(
    JSON.stringify({
      success: true,
      configured,
      message: configured
        ? 'Claude API is configured and ready'
        : 'Claude API key is not configured',
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
