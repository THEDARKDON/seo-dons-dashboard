/**
 * Complete Proposal Generator
 *
 * Orchestrates the full proposal generation process:
 * 1. Deep research on company/market/competitors
 * 2. Content generation with god prompt
 * 3. Returns structured proposal ready for PDF generation
 */

import { performDeepResearch, type ResearchRequest } from './research-agent';
import { generateProposalContent, type ContentGenerationRequest, type ProposalContent } from './content-generator';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ProposalGenerationRequest {
  // Company Information
  companyName: string;
  website?: string;
  industry?: string;
  location?: string;

  // Package Configuration
  packageTier: 'local' | 'regional' | 'national';

  // Optional Customizations
  customInstructions?: string;
  contactName?: string;

  // Additional Context
  additionalContext?: string;

  // Customer Contact Details
  jobTitle?: string;
  phoneNumber?: string;
  email?: string;
  linkedInUrl?: string;
  address?: string;
  postalCode?: string;

  // SDR Notes - Critical for personalization
  notes?: string;

  // Reference Images - SEMrush screenshots, competitor analysis, etc.
  referenceImages?: Array<{
    name: string;
    type: string;
    data: string; // base64
    description: string;
    uploaded_at: string;
  }>;
}

export interface ProposalResult {
  // Research Data
  research: {
    companyAnalysis: any;
    marketIntelligence: any;
    competitorAnalysis: any;
    keywordResearch: any;
    locationStrategy?: any;
    researchedAt: string;
    totalTokensUsed: number;
    estimatedCost: number;
    thinkingTokensUsed: number;
  };

  // Generated Content
  content: ProposalContent;

  // Metadata
  metadata: {
    generatedAt: string;
    totalDurationSeconds: number;
    totalTokensUsed: number;
    totalCost: number;
    modelUsed: string;
  };
}

export interface ProgressCallback {
  (stage: string, progress: number, details?: string): Promise<void>;
}

// ============================================================================
// Main Proposal Generator
// ============================================================================

/**
 * Generate a complete SEO proposal with research and content
 *
 * @param request Proposal generation parameters
 * @param onProgress Optional callback for progress updates
 * @returns Complete proposal with research data and generated content
 */
export async function generateCompleteProposal(
  request: ProposalGenerationRequest,
  onProgress?: ProgressCallback
): Promise<ProposalResult> {
  const startTime = Date.now();
  let totalTokensUsed = 0;
  let totalCost = 0;

  try {
    // =================================================================
    // PHASE 1: DEEP RESEARCH (0-50%)
    // =================================================================
    await onProgress?.('Initializing research', 0, 'Preparing research parameters...');

    const researchRequest: ResearchRequest = {
      companyName: request.companyName,
      website: request.website,
      industry: request.industry,
      location: request.location,
      packageTier: request.packageTier,
      additionalContext: request.additionalContext,
      jobTitle: request.jobTitle,
      phoneNumber: request.phoneNumber,
      email: request.email,
      linkedInUrl: request.linkedInUrl,
      notes: request.notes,
      referenceImages: request.referenceImages,
      address: request.address,
      postalCode: request.postalCode,
    };

    const researchProgressWrapper = async (stage: string, progress: number) => {
      // Map research progress to 0-50% of total progress
      const totalProgress = Math.round(progress / 2);
      await onProgress?.(stage, totalProgress, 'Analyzing data...');
    };

    console.log(`[Proposal Generator] Starting research for: ${request.companyName}`);
    const researchResult = await performDeepResearch(
      researchRequest,
      researchProgressWrapper
    );

    totalTokensUsed += researchResult.totalTokensUsed;
    totalCost += researchResult.estimatedCost;

    console.log(
      `[Proposal Generator] Research complete - Tokens: ${researchResult.totalTokensUsed}, Cost: £${researchResult.estimatedCost.toFixed(4)}`
    );

    // =================================================================
    // PHASE 2: CONTENT GENERATION (50-100%)
    // =================================================================
    await onProgress?.('Generating proposal content', 55, 'Creating executive summary...');

    const contentRequest: ContentGenerationRequest = {
      researchData: researchResult,
      companyName: request.companyName,
      packageTier: request.packageTier,
      customInstructions: request.customInstructions,
      contactName: request.contactName,
      jobTitle: request.jobTitle,
      email: request.email,
      phoneNumber: request.phoneNumber,
      linkedInUrl: request.linkedInUrl,
      notes: request.notes,
      referenceImages: request.referenceImages,
    };

    console.log(`[Proposal Generator] Generating content for: ${request.companyName}`);
    const contentStartTime = Date.now();

    // Note: Content generation happens in one call, but we can simulate progress
    const contentResult = await generateProposalContent(contentRequest);

    const contentDuration = Math.round((Date.now() - contentStartTime) / 1000);
    console.log(
      `[Proposal Generator] Content generation complete in ${contentDuration}s`
    );

    // Update progress through content generation phases
    await onProgress?.('Finalizing proposal structure', 90, 'Preparing final document...');

    // Apply any contact name customization
    if (request.contactName) {
      contentResult.coverPage.preparedFor = request.contactName;
    }

    // =================================================================
    // PHASE 3: FINALIZATION (95-100%)
    // =================================================================
    await onProgress?.('Completing proposal', 95, 'Final checks...');

    const endTime = Date.now();
    const totalDurationSeconds = Math.round((endTime - startTime) / 1000);

    const result: ProposalResult = {
      research: {
        companyAnalysis: researchResult.companyAnalysis,
        marketIntelligence: researchResult.marketIntelligence,
        competitorAnalysis: researchResult.competitorAnalysis,
        keywordResearch: researchResult.keywordResearch,
        locationStrategy: researchResult.locationStrategy,
        researchedAt: researchResult.researchedAt,
        totalTokensUsed: researchResult.totalTokensUsed,
        estimatedCost: researchResult.estimatedCost,
        thinkingTokensUsed: researchResult.thinkingTokensUsed,
      },
      content: contentResult,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalDurationSeconds,
        totalTokensUsed,
        totalCost,
        modelUsed: 'claude-opus-4-20250514',
      },
    };

    await onProgress?.('Proposal complete', 100, 'Ready for review');

    console.log(
      `[Proposal Generator] Complete proposal generated in ${totalDurationSeconds}s - Total cost: £${totalCost.toFixed(4)}`
    );

    return result;
  } catch (error) {
    console.error('[Proposal Generator] Error:', error);
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate proposal generation request
 */
export function validateProposalRequest(request: ProposalGenerationRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!request.companyName || request.companyName.trim().length === 0) {
    errors.push('Company name is required');
  }

  if (request.companyName && request.companyName.length > 100) {
    errors.push('Company name must be less than 100 characters');
  }

  if (!request.packageTier) {
    errors.push('Package tier is required');
  }

  if (request.packageTier && !['local', 'regional', 'national'].includes(request.packageTier)) {
    errors.push('Package tier must be local, regional, or national');
  }

  if (request.website && !isValidUrl(request.website)) {
    errors.push('Invalid website URL format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Basic URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Estimate proposal generation time based on package tier
 */
export function estimateGenerationTime(packageTier: 'local' | 'regional' | 'national'): {
  minSeconds: number;
  maxSeconds: number;
  averageSeconds: number;
} {
  const estimates = {
    local: { minSeconds: 60, maxSeconds: 120, averageSeconds: 90 },
    regional: { minSeconds: 80, maxSeconds: 140, averageSeconds: 110 },
    national: { minSeconds: 100, maxSeconds: 160, averageSeconds: 130 },
  };

  return estimates[packageTier];
}

/**
 * Estimate proposal generation cost
 */
export function estimateGenerationCost(packageTier: 'local' | 'regional' | 'national'): {
  minCost: number;
  maxCost: number;
  averageCost: number;
} {
  // Cost varies based on research depth and content length
  const estimates = {
    local: { minCost: 0.60, maxCost: 0.90, averageCost: 0.75 },
    regional: { minCost: 0.80, maxCost: 1.20, averageCost: 1.00 },
    national: { minCost: 1.00, maxCost: 1.50, averageCost: 1.25 },
  };

  return estimates[packageTier];
}
