/**
 * Claude API Utility Functions
 *
 * This file provides utility functions for working with the Claude API:
 * - Retry logic with exponential backoff
 * - Text sanitization for prompts
 * - JSON parsing from Claude responses
 * - Error handling and validation
 */

import { anthropic, CLAUDE_CONFIG, calculateCost } from './client';
import type { MessageCreateParams } from '@anthropic-ai/sdk/resources/messages';

/**
 * Execute a Claude API call with automatic retry logic
 * Handles rate limits and transient errors with exponential backoff
 *
 * @param fn The async function to execute
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param baseDelay Initial delay in ms before first retry (default: 1000)
 * @returns The result of the function
 */
export async function claudeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (
        error.status === 401 || // Authentication error
        error.status === 403 || // Permission error
        error.status === 400    // Bad request (our fault)
      ) {
        throw error;
      }

      // Retry on rate limits (429) and server errors (5xx)
      if (
        (error.status === 429 || error.status >= 500) &&
        attempt < maxRetries
      ) {
        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(
          `Claude API error (${error.status}), retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`
        );
        await sleep(delay);
        continue;
      }

      // No more retries
      throw error;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Sleep for a specified number of milliseconds
 *
 * @param ms Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sanitize text for use in Claude prompts
 * Removes excessive whitespace and normalizes line breaks
 *
 * @param text The text to sanitize
 * @returns Cleaned text suitable for prompts
 */
export function sanitizeForPrompt(text: string): string {
  if (!text) return '';

  return text
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive blank lines (max 2 consecutive)
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    // Remove leading/trailing whitespace
    .trim();
}

/**
 * Extract JSON from Claude's response
 * Handles responses with or without markdown code blocks
 *
 * @param content The content from Claude's response
 * @returns Parsed JSON object
 */
export function extractJSON<T = any>(content: string): T {
  if (!content) {
    throw new Error('Empty content provided to extractJSON');
  }

  // Try to find JSON in markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    content = codeBlockMatch[1];
  }

  // Remove any leading/trailing whitespace
  content = content.trim();

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    console.error('Failed to parse JSON from Claude response:', content);
    throw new Error(`Invalid JSON in Claude response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Call Claude API with standard configuration for research tasks
 * Includes extended thinking, retry logic, and cost calculation
 *
 * @param systemPrompt The system prompt
 * @param userPrompt The user prompt
 * @param options Optional configuration overrides
 * @returns Claude's response with usage metadata
 */
export async function callClaudeForResearch(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    thinkingBudget?: number;
  }
) {
  const params: MessageCreateParams = {
    model: options?.model || CLAUDE_CONFIG.RESEARCH_MODEL,
    max_tokens: options?.maxTokens || CLAUDE_CONFIG.MAX_TOKENS_RESEARCH,
    temperature: options?.temperature || CLAUDE_CONFIG.TEMPERATURE_RESEARCH,
    thinking: {
      type: 'enabled',
      budget_tokens: options?.thinkingBudget || CLAUDE_CONFIG.THINKING_BUDGET,
    },
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  };

  const response = await claudeWithRetry(() => anthropic.messages.create(params));

  // Extract text content (skip thinking blocks)
  const textContent = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as any).text)
    .join('\n\n');

  // Calculate thinking tokens used
  const thinkingTokens = response.usage.input_tokens - estimatePromptTokens(systemPrompt, userPrompt);

  return {
    content: textContent,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      thinkingTokens: Math.max(0, thinkingTokens),
    },
    cost: calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens,
      Math.max(0, thinkingTokens)
    ),
    model: response.model,
  };
}

/**
 * Call Claude API with standard configuration for content generation
 * Higher temperature for more creative output
 *
 * @param systemPrompt The system prompt
 * @param userPrompt The user prompt
 * @param options Optional configuration overrides
 * @returns Claude's response with usage metadata
 */
export async function callClaudeForContent(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
) {
  const params: MessageCreateParams = {
    model: options?.model || CLAUDE_CONFIG.CONTENT_MODEL,
    max_tokens: options?.maxTokens || CLAUDE_CONFIG.MAX_TOKENS_CONTENT,
    temperature: options?.temperature || CLAUDE_CONFIG.TEMPERATURE_CONTENT,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  };

  const response = await claudeWithRetry(() => anthropic.messages.create(params));

  // Extract text content
  const textContent = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as any).text)
    .join('\n\n');

  return {
    content: textContent,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      thinkingTokens: 0,
    },
    cost: calculateCost(
      response.usage.input_tokens,
      response.usage.output_tokens,
      0
    ),
    model: response.model,
  };
}

/**
 * Estimate token count for prompts (rough approximation)
 * Used for calculating thinking tokens
 *
 * @param systemPrompt The system prompt
 * @param userPrompt The user prompt
 * @returns Estimated token count
 */
function estimatePromptTokens(systemPrompt: string, userPrompt: string): number {
  // Claude uses ~4 characters per token on average
  // Add overhead for message structure
  const systemTokens = Math.ceil(systemPrompt.length / 4);
  const userTokens = Math.ceil(userPrompt.length / 4);
  const overhead = 50; // Message formatting overhead
  return systemTokens + userTokens + overhead;
}

/**
 * Validate company data has required fields for research
 *
 * @param company The company/customer object
 * @returns true if valid, throws error if invalid
 */
export function validateCompanyData(company: any): boolean {
  if (!company) {
    throw new Error('Company data is required');
  }

  if (!company.company_name) {
    throw new Error('Company name is required for research');
  }

  // Website is highly recommended but not strictly required
  if (!company.website) {
    console.warn(`Company ${company.company_name} has no website - research may be limited`);
  }

  return true;
}

/**
 * Format error message for user display
 * Hides technical details while providing useful information
 *
 * @param error The error object
 * @returns User-friendly error message
 */
export function formatClaudeError(error: any): string {
  if (error.status === 401) {
    return 'Claude API authentication failed. Please check your API key configuration.';
  }

  if (error.status === 403) {
    return 'Access denied to Claude API. Please check your API key permissions.';
  }

  if (error.status === 429) {
    return 'Rate limit exceeded. Please try again in a few moments.';
  }

  if (error.status >= 500) {
    return 'Claude API is experiencing technical difficulties. Please try again later.';
  }

  if (error.status === 400) {
    return `Invalid request to Claude API: ${error.message || 'Unknown error'}`;
  }

  // Generic error
  return `Failed to generate proposal: ${error.message || 'Unknown error'}`;
}

/**
 * Truncate text to a maximum length for display
 *
 * @param text The text to truncate
 * @param maxLength Maximum length (default: 100)
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Parse Claude's thinking blocks from response
 * Useful for debugging and understanding Claude's reasoning
 *
 * @param response The full Claude response
 * @returns Array of thinking text blocks
 */
export function extractThinkingBlocks(response: any): string[] {
  if (!response || !response.content) {
    return [];
  }

  return response.content
    .filter((block: any) => block.type === 'thinking')
    .map((block: any) => block.thinking || '');
}

/**
 * Combine multiple text blocks from Claude response
 * Handles both text and thinking blocks
 *
 * @param response The full Claude response
 * @param includeThinking Whether to include thinking blocks (default: false)
 * @returns Combined text content
 */
export function combineResponseBlocks(
  response: any,
  includeThinking: boolean = false
): string {
  if (!response || !response.content) {
    return '';
  }

  const blocks = response.content
    .filter((block: any) => {
      if (block.type === 'text') return true;
      if (block.type === 'thinking' && includeThinking) return true;
      return false;
    })
    .map((block: any) => {
      if (block.type === 'text') return block.text;
      if (block.type === 'thinking') return `[THINKING]\n${block.thinking}\n[/THINKING]`;
      return '';
    });

  return blocks.join('\n\n');
}
