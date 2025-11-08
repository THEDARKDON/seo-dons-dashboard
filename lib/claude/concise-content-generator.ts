/**
 * Concise Proposal Content Generator
 *
 * Generates streamlined 5-6 page proposals focused on key points
 */

import { sanitizeForPrompt, callClaudeForContent } from './utils';
import { ContentGenerationRequest } from './content-generator';
import { sanitizeObjectEncoding } from '@/lib/utils/encoding';
import { calculateProjections, type ProjectionCalculation } from '@/lib/pdf/html-template-improvements';

// Use the same request type as detailed proposals
export type ConciseContentGenerationRequest = ContentGenerationRequest;

export interface ConciseProposalContent {
  coverPage: {
    title: string;
    subtitle: string;
    preparedFor: string;
    date: string;
    contactInfo: string;
  };

  introduction: {
    currentLandscape: string;
    locationContext: string;
    clientGoals: string;
    opportunity: string;
  };

  competition: {
    summary: string;
    comparisonTable: {
      metric: string;
      client: string;
      competitor1: string;
      competitor2: string;
      leader: string;
    }[];
    keyGaps: string[];
    mainOpportunity: string;
  };

  strategy: {
    coreApproach: string;
    keyTactics: string[];
    timeline: {
      phase: string;
      duration: string;
      focus: string;
    }[];
    expectedOutcomes: string[];
  };

  investment: {
    packageName: string;
    monthlyInvestment: number;
    deliverables: string[];
    projectedResults: {
      metric: string;
      current: string;
      month3: string;
      month6: string;
      month12: string;
    }[];
    roiSummary: {
      totalInvestment: number;
      projectedRevenue: number;
      roi: number;
      breakeven: string;
    };
  };

  summary: {
    keyBenefits: string[];
    nextSteps: string[];
    callToAction: string;
  };
}

/**
 * Sanitizes research data to remove undefined values that would break JSON.stringify
 * Converts undefined to null and filters out optional fields with undefined values
 */
function sanitizeResearchData(data: any): any {
  if (data === undefined) return null;
  if (data === null) return null;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeResearchData(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      // Skip undefined values entirely (don't include in output)
      continue;
    }
    sanitized[key] = sanitizeResearchData(value);
  }
  return sanitized;
}

/**
 * Extract and parse JSON from Claude's response
 */
function extractAndParseJSON<T>(content: string): T {
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
    console.error('Failed to parse concise proposal content:', content.substring(0, 500));
    throw new Error(`Invalid JSON in concise proposal content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const CONCISE_SYSTEM_PROMPT = `You are an expert SEO strategist creating CONCISE, HIGH-IMPACT proposals.

CRITICAL RULES:
1. Maximum 1,500-2,000 total words
2. Use bullet points over paragraphs
3. Focus on numbers and specific outcomes
4. No fluff or filler content
5. Direct, confident language
6. Tables and visuals over text

When SDR notes are provided, they are ABSOLUTE TRUTH - use those exact numbers.`;

export async function generateConciseProposalContent(
  request: ConciseContentGenerationRequest
): Promise<ConciseProposalContent> {
  const { companyName, packageTier, notes, averageDealSize, profitPerDeal, conversionRate, researchData } = request;

  // Extract current traffic for projections
  const currentTraffic = researchData?.competitorAnalysis?.clientCurrentMetrics?.monthlyTraffic
    ? parseInt(researchData.competitorAnalysis.clientCurrentMetrics.monthlyTraffic.replace(/[^\d]/g, ''))
    : 200; // Default low traffic if unknown

  const dealValue = averageDealSize || 5000;

  // Calculate projections using single source of truth
  const packageName = packageTier === 'local' ? 'Local Dominance' :
                      packageTier === 'regional' ? 'Regional Authority' :
                      'National Leader';

  const projection = calculateProjections(currentTraffic, packageName, dealValue);

  console.log('[Concise Generator] Calculated Projections:', {
    package: packageName,
    currentTraffic: projection.currentTraffic,
    projectedTraffic: projection.projectedTraffic,
    multiplier: projection.multiplier,
    monthlyLeads: projection.monthlyLeads,
    monthlyCustomers: projection.monthlyCustomers,
    monthlyRevenue: projection.monthlyRevenue,
    annualRevenue: projection.annualRevenue
  });

  const userPrompt = sanitizeForPrompt(`
Generate a CONCISE SEO proposal for ${companyName}

${notes ? `SDR NOTES (USE THESE EXACT NUMBERS):
${notes}
` : ''}

${averageDealSize ? `Deal Size: £${averageDealSize}` : ''}
${profitPerDeal ? `Profit per Deal: £${profitPerDeal}` : ''}
${conversionRate ? `Conversion Rate: ${conversionRate}%` : ''}

${researchData?.enhancedResearch ? `
## REAL RESEARCH DATA (USE THESE EXACT NUMBERS):

### Current Traffic
Monthly Traffic: ${researchData.competitorAnalysis?.clientCurrentMetrics?.monthlyTraffic || 'Unknown'}
Ranking Keywords: ${researchData.competitorAnalysis?.clientCurrentMetrics?.rankingKeywords || 'Limited visibility'}

### Target Keywords (Real SerpAPI Data)
${JSON.stringify(sanitizeResearchData(researchData.enhancedResearch.keywordAnalysis.map(kw => ({
  keyword: kw.keyword,
  position: kw.position !== undefined ? kw.position : 'Not ranking in top 100',
  searchVolume: kw.searchVolume,
  difficulty: kw.difficulty,
  intent: kw.intent,
  topCompetitor: kw.topRankers[0]?.domain || 'N/A'
}))), null, 2)}

### Real Competitors (From Top 10 Rankings)
${JSON.stringify(sanitizeResearchData(researchData.enhancedResearch.competitors.slice(0, 5).map(comp => ({
  domain: comp.domain,
  name: comp.name,
  appearances: comp.rankings.length,
  keywords: comp.rankings.map(r => r.keyword).join(', ')
}))), null, 2)}

### Top Location Opportunities
${JSON.stringify(sanitizeResearchData(researchData.enhancedResearch.locationOpportunities.slice(0, 3).map(loc => ({
  location: loc.location,
  searchVolume: loc.searchVolume,
  currentRanking: loc.currentRanking !== undefined ? loc.currentRanking : 'Not ranking',
  competitorCount: loc.competitorCount
}))), null, 2)}

### Content Opportunities (Top PAA Questions)
${JSON.stringify(sanitizeResearchData(researchData.enhancedResearch.contentOpportunities.paaQuestions.slice(0, 6).map(paa => ({
  question: paa.question,
  priority: paa.priority,
  searchIntent: paa.searchIntent
}))), null, 2)}

**CRITICAL**: Use these EXACT numbers and competitor names in your proposal. Do NOT make up data.
` : ''}

## CALCULATED PROJECTIONS (USE THESE EXACT NUMBERS):

Package: ${packageName}
Monthly Investment: £${packageTier === 'local' ? '2,000' : packageTier === 'regional' ? '3,000' : '5,000'}

Current Monthly Traffic: ${projection.currentTraffic.toLocaleString()} visitors
Projected Monthly Traffic: ${projection.projectedTraffic.toLocaleString()} visitors (${projection.multiplier}x growth)

Monthly Leads: ${projection.monthlyLeads.toLocaleString()} leads
Monthly Customers: ${projection.monthlyCustomers.toLocaleString()} customers
Monthly Revenue: £${projection.monthlyRevenue.toLocaleString()}
Annual Revenue: £${projection.annualRevenue.toLocaleString()}

Conversion Rates:
- Visitor → Lead: ${(projection.conversionRates.visitorToLead * 100).toFixed(1)}%
- Lead → Customer: ${(projection.conversionRates.leadToCustomer * 100).toFixed(0)}%
- Overall Visitor → Customer: ${(projection.conversionRates.visitorToCustomer * 100).toFixed(2)}%

**USE THESE EXACT NUMBERS** in your projectedResults and roiSummary sections.

Generate a CONCISE proposal with this EXACT structure:

\`\`\`json
{
  "coverPage": {
    "title": "[Compelling title, e.g., 'Solar SEO Dominance Strategy']",
    "subtitle": "[Value proposition in one line]",
    "preparedFor": "${companyName}",
    "date": "${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}",
    "contactInfo": "seodons.co.uk"
  },

  "introduction": {
    "currentLandscape": "[2-3 sentences on their current situation]",
    "locationContext": "[1-2 sentences on local market]",
    "clientGoals": "[1-2 sentences on what they want to achieve]",
    "opportunity": "[1 powerful sentence on the opportunity size]"
  },

  "competition": {
    "summary": "[1-2 sentences overview]",
    "comparisonTable": [
      {
        "metric": "[e.g., 'Monthly Traffic']",
        "client": "[current value]",
        "competitor1": "[competitor value]",
        "competitor2": "[competitor value]",
        "leader": "[market leader value]"
      }
    ],
    "keyGaps": [
      "[Gap 1]",
      "[Gap 2]",
      "[Gap 3]"
    ],
    "mainOpportunity": "[1 sentence on biggest opportunity]"
  },

  "strategy": {
    "coreApproach": "[2-3 sentences on main strategy]",
    "keyTactics": [
      "[Tactic 1]",
      "[Tactic 2]",
      "[Tactic 3]",
      "[Tactic 4]",
      "[Tactic 5]"
    ],
    "timeline": [
      {
        "phase": "Month 1-2",
        "duration": "8 weeks",
        "focus": "[Main focus]"
      },
      {
        "phase": "Month 3-4",
        "duration": "8 weeks",
        "focus": "[Main focus]"
      },
      {
        "phase": "Month 5-6",
        "duration": "8 weeks",
        "focus": "[Main focus]"
      }
    ],
    "expectedOutcomes": [
      "[Outcome 1 with number]",
      "[Outcome 2 with number]",
      "[Outcome 3 with number]"
    ]
  },

  "investment": {
    "packageName": "${packageTier === 'local' ? 'Local Dominance' : packageTier === 'regional' ? 'Regional Authority' : 'National Leader'}",
    "monthlyInvestment": ${packageTier === 'local' ? 2000 : packageTier === 'regional' ? 3000 : 5000},
    "deliverables": [
      "[Key deliverable 1]",
      "[Key deliverable 2]",
      "[Key deliverable 3]",
      "[Key deliverable 4]"
    ],
    "projectedResults": [
      {
        "metric": "Enquiries/Leads",
        "current": "[current from SDR notes or research]",
        "month3": "[projection]",
        "month6": "[projection]",
        "month12": "[projection]"
      },
      {
        "metric": "Revenue",
        "current": "[current]",
        "month3": "[projection]",
        "month6": "[projection]",
        "month12": "[projection]"
      }
    ],
    "roiSummary": {
      "totalInvestment": [12-month total],
      "projectedRevenue": [12-month revenue],
      "roi": [percentage],
      "breakeven": "[X months]"
    }
  },

  "summary": {
    "keyBenefits": [
      "[Benefit 1]",
      "[Benefit 2]",
      "[Benefit 3]"
    ],
    "nextSteps": [
      "[Step 1]",
      "[Step 2]",
      "[Step 3]"
    ],
    "callToAction": "[Strong CTA]"
  }
}
\`\`\`

REMEMBER: Keep it CONCISE. No long explanations. Focus on impact and numbers.
  `);

  // Call Claude API for content generation
  console.log('[Concise Generator] Calling Claude API...');
  const response = await callClaudeForContent(
    CONCISE_SYSTEM_PROMPT,
    userPrompt,
    {} // No reference PDF needed for concise
  );

  console.log('[Concise Generator] Parsing Claude response...');
  const content = extractAndParseJSON<ConciseProposalContent>(response.content);

  console.log('[Concise Generator] Sanitizing content...');
  const sanitizedContent = sanitizeObjectEncoding(content);

  console.log('[Concise Generator] Content generation complete');
  console.log(`[Concise Generator] API Cost: $${response.cost.toFixed(4)}`);
  console.log(`[Concise Generator] Tokens: ${response.usage.inputTokens} in, ${response.usage.outputTokens} out`);

  return sanitizedContent;
}