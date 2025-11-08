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
import {
  conductEnhancedResearch,
  type EnhancedResearchRequest,
  type EnhancedResearchResult,
} from '../research/enhanced-research-agent';

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

  // Business Metrics - For accurate ROI calculations
  averageDealSize?: number;
  profitPerDeal?: number;
  conversionRate?: number;
}

export interface CompanyAnalysis {
  businessOverview: {
    coreBusiness: string;
    valueProposition: string;
    targetAudience: string;
    geographicScope: string;
    extractedAddress?: string | null;
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
    customerJourneySteps: Array<{
      stage: 'Awareness' | 'Research' | 'Consideration' | 'Decision';
      typicalBehavior: string;
      exampleSearch: string;
      painPoint: string;
    }>;
  };
  competitiveGaps: string[];
  marketSize: string;

  // Seasonal insights (critical for A1 Mobility-style proposals)
  seasonalPatterns?: Array<{
    period: string; // "Spring (Mar-May)"
    searchVolume: 'Very High' | 'High' | 'Moderate' | 'Low';
    buyingReason: string;
    recommendedStrategy: string;
  }>;

  // Industry-specific insights for credibility
  industrySpecificInsights: {
    whySEOWorks: string; // Why SEO is particularly effective for THIS industry
    buyingPsychology: string; // Emotional factors that drive purchases
    trustFactors: string[]; // What builds trust in this industry
    commonObjections: string[]; // What stops people from buying
  };

  // Conversion benchmarks for realistic ROI modeling
  industryBenchmarks: {
    averageConversionRate: string; // "3-5%"
    averageTransactionValue: string; // "£1,200" or "£500-2,000"
    typicalCloseRate: string; // "20-30%"
    salesCycleLength: string; // "2-4 weeks"
    customerLTV?: string; // "£3,500 over 3 years"
  };
}

export interface CompetitorAnalysis {
  topCompetitors: Array<{
    name: string;
    website: string;
    strengths: string[];
    weaknesses: string[];
    keywordStrategy: string;
    // Quantitative metrics (CRITICAL for A1-style comparison tables)
    estimatedMetrics: {
      monthlyTraffic: string; // "2,000 visitors/month" or "1,500-2,000"
      rankingKeywords: string; // "350 keywords"
      domainAuthority: string; // "DA 45"
      contentPages: string; // "150 pages"
    };
  }>;

  // Client's current estimated metrics for comparison
  clientCurrentMetrics: {
    monthlyTraffic: string;
    rankingKeywords: string;
    domainAuthority: string;
    contentPages: string;
  };

  competitiveAdvantages: string[];
  differentiationOpportunities: string[];

  // Gap analysis with specific numbers (for comparison tables)
  competitiveGaps: Array<{
    metric: string; // "Monthly Organic Traffic"
    yourBusiness: string; // "174 visitors/month"
    topCompetitorA: string; // "2,000 visitors/month"
    topCompetitorB: string; // "1,500 visitors/month"
    marketLeader: string; // "5,000+ visitors/month"
  }>;
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

export interface ROIProjection {
  // Month-by-month progression (CRITICAL for realistic timelines)
  monthlyProgression: Array<{
    period: 'Month 1-3' | 'Month 4-6' | 'Month 7-9' | 'Month 10-12';
    phaseLabel: string; // "Foundation", "Growth", "Acceleration", "Dominance"
    activities: string[]; // What we'll do
    expectedResults: string[]; // What they'll see
    trafficIncrease: string; // "20-30% traffic increase"
    estimatedLeads: string; // "15-20 leads/month"
    estimatedRevenue: string; // "£5,000-12,000/month"
  }>;

  // Overall ROI calculation
  roiCalculation: {
    packageTier: 'local' | 'regional' | 'national';
    monthlyInvestment: number; // £2,000, £3,000, or £5,000
    totalYearOneInvestment: number; // Monthly × 12
    projectedYearOneRevenue: string; // "£1.2M-1.56M"
    netReturn: string; // "£1,164,000-1,524,000"
    roiPercentage: string; // "3,233%-4,233%"
  };

  // Business metrics for accurate projections
  averageDealValue: number; // Customer's actual average deal size
}

export interface ResearchResult {
  companyAnalysis: CompanyAnalysis;
  marketIntelligence: MarketIntelligence;
  competitorAnalysis: CompetitorAnalysis;
  keywordResearch: KeywordResearch;
  locationStrategy?: LocationStrategy;
  roiProjection: ROIProjection; // NEW: Always included

  // Enhanced real-world research data
  enhancedResearch?: EnhancedResearchResult;

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

  // Stage 0: Enhanced Real-World Research (5%) - NEW
  let enhancedResearch: EnhancedResearchResult | undefined;

  // Only attempt enhanced research if API keys are configured and website is available
  if (process.env.PERPLEXITY_API_KEY && process.env.SERPAPI_KEY && request.website) {
    try {
      await onProgress?.('Conducting real-world research', 5);
      console.log('[Research Agent] Starting enhanced research with Perplexity & SerpAPI...');

      const enhancedRequest: EnhancedResearchRequest = {
        companyName: request.companyName,
        website: request.website,
        industry: request.industry,
        location: request.location,
        notes: request.notes,
      };

      enhancedResearch = await conductEnhancedResearch(enhancedRequest);
      console.log('[Research Agent] Enhanced research complete - Real data gathered');
    } catch (error) {
      console.warn('[Research Agent] Enhanced research failed, continuing with Claude-only analysis:', error);
      // Continue without enhanced research - Claude will use its knowledge
    }
  } else {
    console.log('[Research Agent] Enhanced research skipped - API keys not configured or no website');
  }

  // Stage 1: Company Analysis (25%)
  await onProgress?.('Analyzing company and website', 25);
  const companyAnalysis = await analyzeCompany(request, enhancedResearch);
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

  // Stage 5: Location Strategy (85%) - Only for local/regional packages
  let locationStrategy: LocationStrategy | undefined;
  if (request.packageTier === 'local' || request.packageTier === 'regional') {
    await onProgress?.('Analyzing location-based opportunities', 85);
    const locationResult = await researchLocations(request, companyAnalysis.data);
    locationStrategy = locationResult.data;
    totalTokensUsed += locationResult.usage.inputTokens + locationResult.usage.outputTokens;
    totalCost += locationResult.cost;
    thinkingTokensUsed += locationResult.usage.thinkingTokens;
  }

  // Stage 6: ROI Projection (95%) - ALWAYS INCLUDED
  await onProgress?.('Modeling ROI progression and timeline', 95);
  const roiProjection = await modelROIProgression(
    request,
    keywordResearch.data,
    marketIntelligence.data,
    competitorAnalysis.data
  );
  totalTokensUsed += roiProjection.usage.inputTokens + roiProjection.usage.outputTokens;
  totalCost += roiProjection.cost;
  thinkingTokensUsed += roiProjection.usage.thinkingTokens;

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
    roiProjection: roiProjection.data,
    enhancedResearch, // Include real-world research data
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
async function analyzeCompany(
  request: ResearchRequest,
  enhancedResearch?: EnhancedResearchResult
) {
  const systemPrompt = `You are an expert SEO consultant and business analyst. Your task is to deeply analyze a company's business model, digital presence, and opportunities for SEO improvement.

Use your extended thinking to thoroughly understand the business, then provide a structured JSON analysis.${
    enhancedResearch
      ? '\n\nYou have access to REAL RESEARCH DATA from web analysis and competitor intelligence. Use this actual data to inform your analysis rather than speculation.'
      : ''
  }`;

  const userPrompt = sanitizeForPrompt(`${
    enhancedResearch
      ? `\n\n===REAL RESEARCH DATA (use this actual data in your analysis)===\n\nWEBSITE ANALYSIS:\n${JSON.stringify(enhancedResearch.websiteAnalysis, null, 2)}\n\nCOMPANY INTELLIGENCE:\n${JSON.stringify(enhancedResearch.companyIntelligence, null, 2)}\n\nSOCIAL MEDIA PRESENCE:\n${JSON.stringify(enhancedResearch.socialMedia, null, 2)}\n\nMARKET INTELLIGENCE:\n${JSON.stringify(enhancedResearch.marketIntelligence, null, 2)}\n\n===END REAL RESEARCH DATA===\n\n`
      : ''
  }
Analyze this company for an SEO proposal:

**Company Name:** ${request.companyName}
**Website:** ${request.website || 'Not provided'}
**Industry:** ${request.industry || 'Unknown'}
**Location:** ${request.location || 'Unknown'}
**Package Tier:** ${request.packageTier || 'Not specified'}

${request.jobTitle ? `**Contact Job Title:** ${request.jobTitle}` : ''}
${request.email ? `**Contact Email:** ${request.email}` : ''}
${request.phoneNumber ? `**Contact Phone:** ${request.phoneNumber}` : ''}
${request.linkedInUrl ? `**LinkedIn Profile:** ${request.linkedInUrl}` : ''}
${request.address ? `**Business Address:** ${request.address}` : request.website ? '**Business Address:** Please extract from website (look for contact/footer sections)' : ''}

${request.notes ? `**SDR Notes (ABSOLUTE PRIORITY - THESE OVERRIDE ALL OTHER DATA):**
${request.notes}

CRITICAL: The SDR has already spoken to the client and these notes contain:
- The EXACT metrics to use (enquiries, conversion rates, revenue)
- The SPECIFIC package agreed upon
- The ACTUAL business focus (e.g., "Solar & Battery, NOT Electrical")
- Any specific instructions about proposal format

You MUST use these exact specifications, NOT generic industry estimates.
` : ''}

${request.referenceImages && request.referenceImages.length > 0 ? `**Reference Images Provided:** ${request.referenceImages.length} screenshot(s) attached (SEMrush reports, competitor analysis, etc.). Analyze these images for additional insights about traffic, keywords, competitors, and market position.\n` : ''}

${request.averageDealSize || request.profitPerDeal || request.conversionRate ? `**Business Metrics (Use for ROI calculations):**\n${request.averageDealSize ? `- Average Deal Size: £${request.averageDealSize.toFixed(2)}\n` : ''}${request.profitPerDeal ? `- Profit Per Deal: £${request.profitPerDeal.toFixed(2)}\n` : ''}${request.conversionRate ? `- Website Conversion Rate: ${request.conversionRate}%\n` : ''}` : ''}

${request.additionalContext ? `**Additional Context:**\n${request.additionalContext}` : ''}

Provide a comprehensive analysis in the following JSON format:

\`\`\`json
{
  "businessOverview": {
    "coreBusiness": "What does this company do? What products/services do they offer?",
    "valueProposition": "What makes them unique? What value do they provide?",
    "targetAudience": "Who are their ideal customers?",
    "geographicScope": "Where do they operate? Local, regional, national, international?",
    "extractedAddress": "Physical address if found on website (look in contact/footer sections, null if not found)"
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

  // Convert reference images to format expected by callClaudeForResearch
  const images = request.referenceImages?.map(img => ({
    type: img.type,
    data: img.data,
    description: img.description || img.name,
  }));

  const response = await callClaudeForResearch(systemPrompt, userPrompt, {
    images,
  });
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
    "typicalCustomerJourney": "Describe how potential customers search and make decisions in this industry",
    "customerJourneySteps": [
      {
        "stage": "Awareness",
        "typicalBehavior": "What they're experiencing/thinking at this stage",
        "exampleSearch": "Example Google search they'd make (e.g., 'stairlifts Blackpool')",
        "painPoint": "Main problem or concern at this stage"
      },
      {
        "stage": "Research",
        "typicalBehavior": "How they research and compare options",
        "exampleSearch": "Example search query",
        "painPoint": "What's confusing or overwhelming them"
      },
      {
        "stage": "Consideration",
        "typicalBehavior": "How they narrow down choices",
        "exampleSearch": "Example search query",
        "painPoint": "What makes decision difficult"
      },
      {
        "stage": "Decision",
        "typicalBehavior": "Final factors influencing their choice",
        "exampleSearch": "Example search query",
        "painPoint": "Last objections or concerns"
      }
    ]
  },
  "competitiveGaps": [
    "List 3-5 gaps in the market that this company could fill with SEO",
    "Focus on underserved search queries or content opportunities"
  ],
  "marketSize": "Brief assessment of the search demand and market size for this industry",

  "seasonalPatterns": [
    {
      "period": "e.g., Spring (Mar-May)",
      "searchVolume": "Very High or High or Moderate or Low",
      "buyingReason": "Why people buy during this season",
      "recommendedStrategy": "What to promote/focus on"
    }
  ],

  "industrySpecificInsights": {
    "whySEOWorks": "Explain why SEO is particularly effective for THIS specific industry (2-3 sentences)",
    "buyingPsychology": "What emotional factors drive purchases in this industry? What are customers really buying beyond the product?",
    "trustFactors": [
      "List 3-4 specific things that build trust in this industry",
      "e.g., years in business, certifications, showroom visits, reviews"
    ],
    "commonObjections": [
      "List 3-4 common reasons people hesitate to buy",
      "e.g., price concerns, quality worries, installation fears"
    ]
  },

  "industryBenchmarks": {
    "averageConversionRate": "Typical website conversion rate for this industry (e.g., '3-5%' or '2-4%')",
    "averageTransactionValue": "Typical sale value (e.g., '£1,200' or '£500-2,000')",
    "typicalCloseRate": "What percentage of leads become sales (e.g., '20-30%' or '15-25%')",
    "salesCycleLength": "How long from first contact to sale (e.g., '2-4 weeks' or 'same day to 3 months')",
    "customerLTV": "Optional: Lifetime value if repeat purchases common (e.g., '£3,500 over 3 years')"
  }
}
\`\`\`

IMPORTANT:
- Seasonal patterns: If the industry doesn't have strong seasonality, provide "N/A" or minimal data
- Customer journey: Be VERY specific with example searches - use real keywords people would type
- Industry benchmarks: These are CRITICAL for ROI modeling - research typical conversion rates for this industry
- Buying psychology: Think about what customers are REALLY buying (e.g., mobility equipment = independence, not just a scooter)
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

${request.referenceImages && request.referenceImages.length > 0 ? `**Reference Images Provided:** ${request.referenceImages.length} screenshot(s) attached. Use any SEMrush reports, competitor analysis, or traffic data from these images to inform your analysis with REAL numbers instead of estimates.\n` : ''}

Provide competitive analysis in the following JSON format:

\`\`\`json
{
  "topCompetitors": [
    {
      "name": "Competitor name",
      "website": "Their website URL (use typical format: competitor-name.co.uk)",
      "strengths": ["List 2-3 SEO/digital strengths"],
      "weaknesses": ["List 2-3 SEO/digital weaknesses or gaps"],
      "keywordStrategy": "Brief summary of their keyword targeting approach",
      "estimatedMetrics": {
        "monthlyTraffic": "Estimated monthly organic traffic (e.g., '2,000 visitors/month' or '1,500-2,000')",
        "rankingKeywords": "Estimated ranking keywords (e.g., '350 keywords' or '200-400')",
        "domainAuthority": "Estimated DA if known (e.g., 'DA 45' or 'DA 40-50')",
        "contentPages": "Estimated content pages (e.g., '150 pages' or '100-200 pages')"
      }
    }
  ],

  "clientCurrentMetrics": {
    "monthlyTraffic": "YOUR CLIENT's estimated current monthly traffic (be realistic, e.g., '174 visitors/month')",
    "rankingKeywords": "YOUR CLIENT's current ranking keywords (e.g., '71 keywords')",
    "domainAuthority": "YOUR CLIENT's estimated DA (e.g., 'DA 25')",
    "contentPages": "YOUR CLIENT's current content pages (e.g., '20 pages')"
  },

  "competitiveAdvantages": [
    "List 3-5 advantages this company has or could develop",
    "Focus on unique selling points that could be leveraged in SEO"
  ],
  "differentiationOpportunities": [
    "List 3-5 ways this company can differentiate through content and SEO",
    "Be specific and actionable"
  ],

  "competitiveGaps": [
    {
      "metric": "Monthly Organic Traffic",
      "yourBusiness": "174 visitors/month",
      "topCompetitorA": "2,000 visitors/month",
      "topCompetitorB": "1,500 visitors/month",
      "marketLeader": "5,000+ visitors/month"
    },
    {
      "metric": "Ranking Keywords",
      "yourBusiness": "71 keywords",
      "topCompetitorA": "350 keywords",
      "topCompetitorB": "280 keywords",
      "marketLeader": "600+ keywords"
    },
    {
      "metric": "Domain Authority",
      "yourBusiness": "DA 25",
      "topCompetitorA": "DA 45",
      "topCompetitorB": "DA 42",
      "marketLeader": "DA 55"
    },
    {
      "metric": "Content Pages",
      "yourBusiness": "20 pages",
      "topCompetitorA": "150 pages",
      "topCompetitorB": "120 pages",
      "marketLeader": "200+ pages"
    }
  ]
}
\`\`\`

CRITICAL INSTRUCTIONS:
- Include 3-5 top competitors with REAL estimated metrics
- Use "Top Competitor A", "Top Competitor B", "Market Leader" naming in competitiveGaps
- Metrics should be realistic educated guesses based on industry norms
- clientCurrentMetrics should be conservative/realistic for a business needing SEO help
- competitiveGaps MUST have at least 3-4 rows with specific numbers
  `);

  // Convert reference images to format expected by callClaudeForResearch
  const images = request.referenceImages?.map(img => ({
    type: img.type,
    data: img.data,
    description: img.description || img.name,
  }));

  const response = await callClaudeForResearch(systemPrompt, userPrompt, {
    images,
  });
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

/**
 * Stage 6: Model ROI progression (ALWAYS INCLUDED - critical for A1 Mobility-style proposals)
 */
async function modelROIProgression(
  request: ResearchRequest,
  keywordResearch: KeywordResearch,
  marketIntelligence: MarketIntelligence,
  competitorAnalysis: CompetitorAnalysis
) {
  const systemPrompt = `You are an expert SEO strategist and business analyst. Your task is to create realistic, month-by-month ROI projections based on keyword difficulty, industry benchmarks, and competitive analysis.`;

  // Determine package investment
  const packageInvestments = {
    local: 2000,
    regional: 3000,
    national: 5000,
  };
  const monthlyInvestment = packageInvestments[request.packageTier || 'regional'];

  const userPrompt = sanitizeForPrompt(`
Create a realistic 12-month ROI progression for this SEO campaign:

**Company:** ${request.companyName}
**Package Tier:** ${request.packageTier || 'regional'} (£${monthlyInvestment}/month investment)
**Industry Conversion Rate:** ${marketIntelligence.industryBenchmarks.averageConversionRate}
**Average Transaction Value:** ${marketIntelligence.industryBenchmarks.averageTransactionValue}
**Typical Close Rate:** ${marketIntelligence.industryBenchmarks.typicalCloseRate}
**Sales Cycle:** ${marketIntelligence.industryBenchmarks.salesCycleLength}

**Current Metrics:**
- Monthly Traffic: ${competitorAnalysis.clientCurrentMetrics.monthlyTraffic}
- Ranking Keywords: ${competitorAnalysis.clientCurrentMetrics.rankingKeywords}

**Target Keywords:** ${keywordResearch.primaryKeywords.length} primary keywords with difficulty ranging from ${keywordResearch.primaryKeywords[0]?.difficulty || 'Medium'} to High

**Competitive Landscape:** ${competitorAnalysis.topCompetitors.length} strong competitors identified

Provide ROI projection in the following JSON format:

\`\`\`json
{
  "monthlyProgression": [
    {
      "period": "Month 1-3",
      "phaseLabel": "Foundation",
      "activities": [
        "Fix technical SEO issues",
        "Optimize Google Business Profile",
        "Launch first 15 content pages",
        "Begin review generation campaign"
      ],
      "expectedResults": [
        "20-30% traffic increase",
        "First local rankings appear",
        "15-20 Google reviews",
        "Technical score improvement to 85+"
      ],
      "trafficIncrease": "20-30%",
      "estimatedLeads": "15-20 leads/month",
      "estimatedRevenue": "£5,000-12,000/month"
    },
    {
      "period": "Month 4-6",
      "phaseLabel": "Growth",
      "activities": [
        "30+ content pages published",
        "Link building accelerates",
        "Content library expanding",
        "Conversion rate optimization"
      ],
      "expectedResults": [
        "100-150% traffic increase from baseline",
        "10-15 keywords ranking in top 10",
        "40+ Google reviews",
        "Lead quality improving"
      ],
      "trafficIncrease": "100-150%",
      "estimatedLeads": "30-45 leads/month",
      "estimatedRevenue": "£30,000-55,000/month"
    },
    {
      "period": "Month 7-9",
      "phaseLabel": "Acceleration",
      "activities": [
        "50+ content pages live",
        "Authority building in full swing",
        "Video content integration",
        "PR and outreach campaigns"
      ],
      "expectedResults": [
        "250-350% traffic increase from baseline",
        "20-30 keywords in top 5",
        "60+ Google reviews",
        "Brand recognition building"
      ],
      "trafficIncrease": "250-350%",
      "estimatedLeads": "50-70 leads/month",
      "estimatedRevenue": "£65,000-105,000/month"
    },
    {
      "period": "Month 10-12",
      "phaseLabel": "Market Dominance",
      "activities": [
        "70+ comprehensive content pages",
        "Market leader positioning",
        "Advanced optimization techniques",
        "Regional expansion planning"
      ],
      "expectedResults": [
        "400-600% traffic increase from baseline",
        "25-40 keywords in top 3 positions",
        "100+ Google reviews",
        "Consistent market leader visibility"
      ],
      "trafficIncrease": "400-600%",
      "estimatedLeads": "70-100 leads/month",
      "estimatedRevenue": "£100,000-150,000/month"
    }
  ],
  "roiCalculation": {
    "packageTier": "${request.packageTier || 'regional'}",
    "monthlyInvestment": ${monthlyInvestment},
    "totalYearOneInvestment": ${monthlyInvestment * 12},
    "projectedYearOneRevenue": "Calculate realistic total based on monthly progression (e.g., '£1.2M-1.56M')",
    "netReturn": "Calculate net return (revenue - investment, e.g., '£1,164,000-1,524,000')",
    "roiPercentage": "Calculate ROI percentage (e.g., '3,233%-4,233%')"
  }
}
\`\`\`

CRITICAL INSTRUCTIONS:
- Base progression on REALISTIC timelines (SEO takes 3-4 months to show results)
- Traffic increases should be gradual and compound over time
- Month 1-3 is foundation (minimal revenue increase)
- Month 4-6 is where real traction begins
- Month 7-12 is acceleration phase
- Revenue calculations should use the industry benchmarks provided
- ROI should be aggressive but believable (typical SEO ROI is 500-5,000%)
- Higher investment packages (national) should show faster results and higher final numbers
  `);

  const response = await callClaudeForResearch(systemPrompt, userPrompt);
  const data = extractJSON<ROIProjection>(response.content);

  // Add the actual average deal value from customer data (or use default)
  const enrichedData: ROIProjection = {
    ...data,
    averageDealValue: request.averageDealSize || 5000
  };

  return {
    data: enrichedData,
    usage: response.usage,
    cost: response.cost,
  };
}
