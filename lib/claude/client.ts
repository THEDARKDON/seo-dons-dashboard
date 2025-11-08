/**
 * Claude API Client Configuration
 *
 * This file initializes the Anthropic SDK and provides configuration
 * for Claude API interactions including models, pricing, and settings.
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client with API key from environment
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 600000, // 10 minutes (600 seconds) - matches Vercel Pro limit
  maxRetries: 2, // Retry failed requests up to 2 times
});

// Model configuration constants
export const CLAUDE_CONFIG = {
  // Use Opus 4 for research (best reasoning with extended thinking)
  RESEARCH_MODEL: 'claude-opus-4-20250514' as const,

  // Use Sonnet 4 for content generation (40-45% cost savings, 95% quality)
  // Content generation is template-filling, not complex reasoning
  CONTENT_MODEL: 'claude-sonnet-4-20250514' as const,

  // Extended thinking budget for deep research (10K tokens)
  THINKING_BUDGET: 10000,

  // Max tokens for responses
  MAX_TOKENS_RESEARCH: 16000,
  MAX_TOKENS_CONTENT: 16000,

  // Temperature settings
  // NOTE: Extended thinking requires temperature = 1.0
  // See: https://docs.claude.com/en/docs/build-with-claude/extended-thinking
  TEMPERATURE_RESEARCH: 1.0, // Required for extended thinking
  TEMPERATURE_CONTENT: 0.5,  // Consistent formatting for proposals
} as const;

// Pricing constants (updated as of January 2025)
// Source: https://www.anthropic.com/pricing
export const CLAUDE_PRICING = {
  // Claude Opus 4 pricing (per million tokens in USD)
  OPUS_INPUT_COST_PER_M: 15.00,     // $15 per 1M input tokens
  OPUS_OUTPUT_COST_PER_M: 75.00,    // $75 per 1M output tokens
  OPUS_THINKING_COST_PER_M: 15.00,  // $15 per 1M thinking tokens

  // Claude Sonnet 4 pricing (per million tokens in USD)
  SONNET_INPUT_COST_PER_M: 3.00,    // $3 per 1M input tokens
  SONNET_OUTPUT_COST_PER_M: 15.00,  // $15 per 1M output tokens

  // Legacy/Backward compatibility (defaults to Opus)
  INPUT_COST_PER_M: 15.00,
  OUTPUT_COST_PER_M: 75.00,
  THINKING_COST_PER_M: 15.00,

  // GBP conversion rate (approximate)
  USD_TO_GBP: 0.79,
} as const;

/**
 * Calculate the cost of a Claude API call in GBP
 *
 * @param inputTokens Number of input tokens used
 * @param outputTokens Number of output tokens generated
 * @param thinkingTokens Number of extended thinking tokens used (optional)
 * @param model Model name (for accurate pricing)
 * @returns Total cost in GBP
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  thinkingTokens: number = 0,
  model?: string
): number {
  // Determine pricing based on model
  let inputCostPerM = CLAUDE_PRICING.OPUS_INPUT_COST_PER_M;
  let outputCostPerM = CLAUDE_PRICING.OPUS_OUTPUT_COST_PER_M;

  if (model?.includes('sonnet')) {
    inputCostPerM = CLAUDE_PRICING.SONNET_INPUT_COST_PER_M;
    outputCostPerM = CLAUDE_PRICING.SONNET_OUTPUT_COST_PER_M;
  }

  const inputCost = (inputTokens / 1000000) * inputCostPerM;
  const outputCost = (outputTokens / 1000000) * outputCostPerM;
  const thinkingCost = (thinkingTokens / 1000000) * CLAUDE_PRICING.OPUS_THINKING_COST_PER_M;

  const totalUSD = inputCost + outputCost + thinkingCost;
  return Number((totalUSD * CLAUDE_PRICING.USD_TO_GBP).toFixed(4));
}

/**
 * Format token count for display
 *
 * @param tokens Number of tokens
 * @returns Formatted string (e.g., "1.2K" or "1.5M")
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Estimate tokens for a text string (rough approximation)
 * Claude uses ~4 characters per token on average
 *
 * @param text The text to estimate
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if API key is configured
 *
 * @returns true if API key exists
 */
export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-');
}

/**
 * Validate Claude API response structure
 *
 * @param response The response from Claude
 * @returns true if response is valid
 */
export function isValidClaudeResponse(response: any): boolean {
  return (
    response &&
    response.content &&
    Array.isArray(response.content) &&
    response.content.length > 0 &&
    response.usage &&
    typeof response.usage.input_tokens === 'number' &&
    typeof response.usage.output_tokens === 'number'
  );
}
