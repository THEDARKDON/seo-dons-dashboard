/**
 * Claude Research Agent
 *
 * This agent performs deep research on companies using Claude's extended thinking.
 * It analyzes company websites, competitors, market positioning, and generates
 * data-driven insights for SEO proposals.
 */

import {
  callClaudeForResearch,
  extractJSON,
  sanitizeForPrompt,
  validateCompanyData,
} from './utils';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ResearchRequest {
  companyName: string;
  website?: string;
  industry?: string;
  location?: string;
  packageTier?: 'local' | 'regional' | 'national';
  additionalContext?: string;
}

export interface CompanyAnalysis {
  businessOverview: {
    coreBusiness: string;
    valueProposition: string;
    targetAudience: string;
    geographicScope: string;
  };
  currentDigitalPresence: {
    websiteQuality: string;
    contentStrategy: string;
    technicalSEO: string;
    userExperience: string;
  };
  painPoints: string[];
  opportunities: string[];
}

export interface MarketIntelligence {
  industryTrends: string[];
  searchBehavior: {
    primarySearchIntents: string[];
    typicalCustomerJourney: string;
  };
  competitiveGaps: string[];
  marketSize: string;
}

export interface CompetitorAnalysis {
  topCompetitors: Array<{
    name: string;
    website: string;
    strengths: string[];
    weaknesses: string[];
    keywordStrategy: string;
  }>;
  competitiveAdvantages: string[];
  differentiationOpportunities: string[];
}

export interface KeywordResearch {
  primaryKeywords: Array<{
    keyword: string;
    searchVolume: string;
    difficulty: string;
    businessValue: string;
    currentRanking?: string;
  }>;
  secondaryKeywords: Array<{
    keyword: string;
    searchVolume: string;
    opportunity: string;
  }>;
  longTailOpportunities: string[];
}

export interface LocationStrategy {
  targetLocations: Array<{
    area: string;
    population: string;
    searchDemand: string;
    competitionLevel: string;
  }>;
  localSEOOpportunities: string[];
}

export interface ResearchResult {
  companyAnalysis: CompanyAnalysis;
  marketIntelligence: MarketIntelligence;
  competitorAnalysis: CompetitorAnalysis;
  keywordResearch: KeywordResearch;
  locationStrategy?: LocationStrategy;

  // Metadata
  researchedAt: string;
  totalTokensUsed: number;
  estimatedCost: number;
  thinkingTokensUsed: number;
}

// ============================================================================
// Research Agent Implementation
// ============================================================================

/**
 * Perform comprehensive company research for SEO proposal
 *
 * @param request Research parameters
 * @param onProgress Optional callback for progress updates
 * @returns Complete research results
 */
export async function performDeepResearch(
  request: ResearchRequest,
  onProgress?: (stage: string, progress: number) => Promise<void>
): Promise<ResearchResult> {
  // Validate input
  validateCompanyData({
    company_name: request.companyName,
    website: request.website,
  });

  const startTime = Date.now();
  let totalTokensUsed = 0;
  let totalCost = 0;
  let thinkingTokensUsed = 0;

  // Stage 1: Company Analysis (25%)
  await onProgress?.('Analyzing company and website', 25);
  const companyAnalysis = await analyzeCompany(request);
  totalTokensUsed += companyAnalysis.usage.inputTokens + companyAnalysis.usage.outputTokens;
  totalCost += companyAnalysis.cost;
  thinkingTokensUsed += companyAnalysis.usage.thinkingTokens;

  // Stage 2: Market Intelligence (50%)
  await onProgress?.('Researching market and industry trends', 50);
  const marketIntelligence = await researchMarket(request, companyAnalysis.data);
  totalTokensUsed += marketIntelligence.usage.inputTokens + marketIntelligence.usage.outputTokens;
  totalCost += marketIntelligence.cost;
  thinkingTokensUsed += marketIntelligence.usage.thinkingTokens;

  // Stage 3: Competitor Analysis (70%)
  await onProgress?.('Analyzing competitors and competitive landscape', 70);
  const competitorAnalysis = await analyzeCompetitors(request, companyAnalysis.data);
  totalTokensUsed += competitorAnalysis.usage.inputTokens + competitorAnalysis.usage.outputTokens;
  totalCost += competitorAnalysis.cost;
  thinkingTokensUsed += competitorAnalysis.usage.thinkingTokens;

  // Stage 4: Keyword Research (85%)
  await onProgress?.('Identifying keyword opportunities', 85);
  const keywordResearch = await researchKeywords(request, companyAnalysis.data, competitorAnalysis.data);
  totalTokensUsed += keywordResearch.usage.inputTokens + keywordResearch.usage.outputTokens;
  totalCost += keywordResearch.cost;
  thinkingTokensUsed += keywordResearch.usage.thinkingTokens;

  // Stage 5: Location Strategy (95%) - Only for local/regional packages
  let locationStrategy: LocationStrategy | undefined;
  if (request.packageTier === 'local' || request.packageTier === 'regional') {
    await onProgress?.('Analyzing location-based opportunities', 95);
    const locationResult = await researchLocations(request, companyAnalysis.data);
    locationStrategy = locationResult.data;
    totalTokensUsed += locationResult.usage.inputTokens + locationResult.usage.outputTokens;
    totalCost += locationResult.cost;
    thinkingTokensUsed += locationResult.usage.thinkingTokens;
  }

  await onProgress?.('Finalizing research report', 100);

  const endTime = Date.now();
  const durationSeconds = Math.round((endTime - startTime) / 1000);

  console.log(`Research completed in ${durationSeconds}s - Tokens: ${totalTokensUsed}, Cost: £${totalCost.toFixed(4)}`);

  return {
    companyAnalysis: companyAnalysis.data,
    marketIntelligence: marketIntelligence.data,
    competitorAnalysis: competitorAnalysis.data,
    keywordResearch: keywordResearch.data,
    locationStrategy,
    researchedAt: new Date().toISOString(),
    totalTokensUsed,
    estimatedCost: totalCost,
    thinkingTokensUsed,
  };
}

// ============================================================================
// Individual Research Functions
// ============================================================================

/**
 * Stage 1: Analyze company and website
 */
async function analyzeCompany(request: ResearchRequest) {
  const systemPrompt = `You are an expert SEO consultant and business analyst. Your task is to deeply analyze a company's business model, digital presence, and opportunities for SEO improvement.

Use your extended thinking to thoroughly understand the business, then provide a structured JSON analysis.`;

  const userPrompt = sanitizeForPrompt(`
Analyze this company for an SEO proposal:

**Company Name:** ${request.companyName}
**Website:** ${request.website || 'Not provided'}
**Industry:** ${request.industry || 'Unknown'}
**Location:** ${request.location || 'Unknown'}
**Package Tier:** ${request.packageTier || 'Not specified'}

${request.additionalContext ? `**Additional Context:**\n${request.additionalContext}` : ''}

Provide a comprehensive analysis in the following JSON format:

\`\`\`json
{
  "businessOverview": {
    "coreBusiness": "What does this company do? What products/services do they offer?",
    "valueProposition": "What makes them unique? What value do they provide?",
    "targetAudience": "Who are their ideal customers?",
    "geographicScope": "Where do they operate? Local, regional, national, international?"
  },
  "currentDigitalPresence": {
    "websiteQuality": "Assessment of their current website (design, content, functionality)",
    "contentStrategy": "Analysis of their content approach and quality",
    "technicalSEO": "Observations about technical SEO (site structure, speed, mobile-friendliness)",
    "userExperience": "How easy is it for users to navigate and convert?"
  },
  "painPoints": [
    "List 3-5 major challenges or weaknesses in their current digital presence",
    "Each should be specific and actionable"
  ],
  "opportunities": [
    "List 3-5 major opportunities for SEO improvement",
    "Each should be specific and impactful"
  ]
}
\`\`\`

Think deeply about this company, their market position, and how SEO can drive real business results for them.
  `);

  const response = await callClaudeForResearch(systemPrompt, userPrompt);
  const data = extractJSON<CompanyAnalysis>(response.content);

  return {
    data,
    usage: response.usage,
    cost: response.cost,
  };
}

/**
 * Stage 2: Research market and industry trends
 */
async function researchMarket(
  request: ResearchRequest,
  companyAnalysis: CompanyAnalysis
) {
  const systemPrompt = `You are an expert market researcher and SEO strategist. Your task is to analyze industry trends, search behavior, and market dynamics for SEO strategy development.`;

  const userPrompt = sanitizeForPrompt(`
Based on this company analysis, research the market and industry landscape:

**Company:** ${request.companyName}
**Industry:** ${request.industry || companyAnalysis.businessOverview.coreBusiness}
**Target Audience:** ${companyAnalysis.businessOverview.targetAudience}
**Geographic Scope:** ${companyAnalysis.businessOverview.geographicScope}

Provide market intelligence in the following JSON format:

\`\`\`json
{
  "industryTrends": [
    "List 4-6 current trends in this industry that affect search behavior",
    "Each should be relevant to SEO strategy"
  ],
  "searchBehavior": {
    "primarySearchIntents": [
      "What are people searching for when looking for these services?",
      "List 3-5 primary search intents"
    ],
    "typicalCustomerJourney": "Describe how potential customers search and make decisions in this industry"
  },
  "competitiveGaps": [
    "List 3-5 gaps in the market that this company could fill with SEO",
    "Focus on underserved search queries or content opportunities"
  ],
  "marketSize": "Brief assessment of the search demand and market size for this industry"
}
\`\`\`

Focus on actionable insights that will inform the SEO strategy.
  `);

  const response = await callClaudeForResearch(systemPrompt, userPrompt);
  const data = extractJSON<MarketIntelligence>(response.content);

  return {
    data,
    usage: response.usage,
    cost: response.cost,
  };
}

/**
 * Stage 3: Analyze competitors
 */
async function analyzeCompetitors(
  request: ResearchRequest,
  companyAnalysis: CompanyAnalysis
) {
  const systemPrompt = `You are an expert competitive intelligence analyst and SEO strategist. Your task is to analyze the competitive landscape and identify opportunities for differentiation.`;

  const userPrompt = sanitizeForPrompt(`
Analyze the competitive landscape for this company:

**Company:** ${request.companyName}
**Industry:** ${request.industry || companyAnalysis.businessOverview.coreBusiness}
**Location:** ${request.location || companyAnalysis.businessOverview.geographicScope}
**Value Proposition:** ${companyAnalysis.businessOverview.valueProposition}

Provide competitive analysis in the following JSON format:

\`\`\`json
{
  "topCompetitors": [
    {
      "name": "Competitor name",
      "website": "Their website URL (use typical format: competitor-name.co.uk)",
      "strengths": ["List 2-3 SEO/digital strengths"],
      "weaknesses": ["List 2-3 SEO/digital weaknesses or gaps"],
      "keywordStrategy": "Brief summary of their keyword targeting approach"
    }
  ],
  "competitiveAdvantages": [
    "List 3-5 advantages this company has or could develop",
    "Focus on unique selling points that could be leveraged in SEO"
  ],
  "differentiationOpportunities": [
    "List 3-5 ways this company can differentiate through content and SEO",
    "Be specific and actionable"
  ]
}
\`\`\`

Include 3-5 top competitors. Be realistic and insightful.
  `);

  const response = await callClaudeForResearch(systemPrompt, userPrompt);
  const data = extractJSON<CompetitorAnalysis>(response.content);

  return {
    data,
    usage: response.usage,
    cost: response.cost,
  };
}

/**
 * Stage 4: Research keywords
 */
async function researchKeywords(
  request: ResearchRequest,
  companyAnalysis: CompanyAnalysis,
  competitorAnalysis: CompetitorAnalysis
) {
  const systemPrompt = `You are an expert keyword researcher and SEO strategist. Your task is to identify high-value keyword opportunities based on business goals, search demand, and competitive analysis.`;

  const userPrompt = sanitizeForPrompt(`
Identify keyword opportunities for this company:

**Company:** ${request.companyName}
**Core Business:** ${companyAnalysis.businessOverview.coreBusiness}
**Target Audience:** ${companyAnalysis.businessOverview.targetAudience}
**Package Tier:** ${request.packageTier || 'Not specified'}
**Competitive Gaps:** ${competitorAnalysis.competitiveAdvantages.join(', ')}

Provide keyword research in the following JSON format:

\`\`\`json
{
  "primaryKeywords": [
    {
      "keyword": "Exact keyword phrase",
      "searchVolume": "Estimated monthly searches (e.g., '2,400' or '500-1,000')",
      "difficulty": "Low, Medium, or High",
      "businessValue": "Why this keyword is valuable for this business",
      "currentRanking": "Estimated current ranking position if known, or 'Not ranking'"
    }
  ],
  "secondaryKeywords": [
    {
      "keyword": "Related keyword phrase",
      "searchVolume": "Estimated monthly searches",
      "opportunity": "Brief explanation of the opportunity"
    }
  ],
  "longTailOpportunities": [
    "List 5-8 long-tail keyword phrases with lower competition",
    "These should be 4+ words and highly specific"
  ]
}
\`\`\`

Include 5-8 primary keywords, 8-12 secondary keywords, and 5-8 long-tail opportunities.
Focus on commercial intent and business value.
  `);

  const response = await callClaudeForResearch(systemPrompt, userPrompt);
  const data = extractJSON<KeywordResearch>(response.content);

  return {
    data,
    usage: response.usage,
    cost: response.cost,
  };
}

/**
 * Stage 5: Research location-based opportunities (for local/regional packages)
 */
async function researchLocations(
  request: ResearchRequest,
  companyAnalysis: CompanyAnalysis
) {
  const systemPrompt = `You are an expert local SEO strategist. Your task is to identify high-value geographic targeting opportunities based on business scope and market demand.`;

  const userPrompt = sanitizeForPrompt(`
Identify location-based SEO opportunities for this company:

**Company:** ${request.companyName}
**Core Business:** ${companyAnalysis.businessOverview.coreBusiness}
**Current Geographic Scope:** ${companyAnalysis.businessOverview.geographicScope}
**Package Tier:** ${request.packageTier}
**Location:** ${request.location || 'UK'}

Provide location strategy in the following JSON format:

\`\`\`json
{
  "targetLocations": [
    {
      "area": "City or region name",
      "population": "Estimated population",
      "searchDemand": "Estimated local search volume (High/Medium/Low)",
      "competitionLevel": "Local competition level (High/Medium/Low)"
    }
  ],
  "localSEOOpportunities": [
    "List 4-6 specific local SEO tactics for these locations",
    "Include Google Business Profile optimization, local citations, location pages, etc."
  ]
}
\`\`\`

For local packages: Focus on 3-5 nearby cities/towns
For regional packages: Focus on 5-10 cities across the region
  `);

  const response = await callClaudeForResearch(systemPrompt, userPrompt);
  const data = extractJSON<LocationStrategy>(response.content);

  return {
    data,
    usage: response.usage,
    cost: response.cost,
  };
}
