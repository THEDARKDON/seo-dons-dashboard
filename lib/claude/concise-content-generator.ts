/**
 * Concise Proposal Content Generator
 *
 * Generates streamlined 5-6 page proposals focused on key points
 */

import { sanitizeForPrompt } from './utils';
import { ContentGenerationRequest } from './content-generator';

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

  const userPrompt = sanitizeForPrompt(`
Generate a CONCISE SEO proposal for ${companyName}

${notes ? `SDR NOTES (USE THESE EXACT NUMBERS):
${notes}
` : ''}

${averageDealSize ? `Deal Size: £${averageDealSize}` : ''}
${profitPerDeal ? `Profit per Deal: £${profitPerDeal}` : ''}
${conversionRate ? `Conversion Rate: ${conversionRate}%` : ''}

RESEARCH DATA:
${JSON.stringify(researchData, null, 2)}

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

  // This would normally call Claude API
  // For now, returning a structured example
  return {
    coverPage: {
      title: "SEO Growth Strategy",
      subtitle: "Transform Your Digital Presence",
      preparedFor: companyName,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      contactInfo: "seodons.co.uk"
    },
    introduction: {
      currentLandscape: "Your business is currently underperforming in organic search.",
      locationContext: "The local market presents significant opportunity.",
      clientGoals: "You want to increase qualified leads through SEO.",
      opportunity: "There's a £1M+ opportunity in untapped search traffic."
    },
    competition: {
      summary: "Competitors are capturing your potential customers.",
      comparisonTable: [
        {
          metric: "Monthly Traffic",
          client: "100",
          competitor1: "1,500",
          competitor2: "2,000",
          leader: "5,000+"
        }
      ],
      keyGaps: [
        "Limited keyword rankings",
        "No local presence",
        "Weak content strategy"
      ],
      mainOpportunity: "Capture 30% market share within 12 months."
    },
    strategy: {
      coreApproach: "Focus on high-intent local searches with comprehensive content.",
      keyTactics: [
        "Technical SEO optimization",
        "Local landing pages",
        "Content marketing",
        "Link building",
        "Conversion optimization"
      ],
      timeline: [
        {
          phase: "Month 1-2",
          duration: "8 weeks",
          focus: "Technical fixes and foundation"
        },
        {
          phase: "Month 3-4",
          duration: "8 weeks",
          focus: "Content creation and local SEO"
        },
        {
          phase: "Month 5-6",
          duration: "8 weeks",
          focus: "Scale and optimize"
        }
      ],
      expectedOutcomes: [
        "10x increase in organic traffic",
        "50+ qualified leads monthly",
        "Top 3 rankings for target keywords"
      ]
    },
    investment: {
      packageName: "Local Dominance",
      monthlyInvestment: 2000,
      deliverables: [
        "20 target keywords",
        "10 content pieces monthly",
        "15 quality backlinks monthly",
        "Monthly reporting"
      ],
      projectedResults: [
        {
          metric: "Enquiries/Leads",
          current: "2",
          month3: "10",
          month6: "25",
          month12: "50"
        },
        {
          metric: "Revenue",
          current: "£5,000",
          month3: "£30,000",
          month6: "£75,000",
          month12: "£150,000"
        }
      ],
      roiSummary: {
        totalInvestment: 24000,
        projectedRevenue: 500000,
        roi: 1983,
        breakeven: "2 months"
      }
    },
    summary: {
      keyBenefits: [
        "Dominate local search results",
        "Generate consistent qualified leads",
        "Build long-term organic growth"
      ],
      nextSteps: [
        "Schedule strategy call",
        "Sign agreement",
        "Begin implementation"
      ],
      callToAction: "Let's start your SEO transformation today."
    }
  };
}