/**
 * Claude Content Generator
 *
 * Transforms research data into comprehensive 18-page SEO proposal content
 * matching the A1 Mobility template style.
 */

import { callClaudeForContent, sanitizeForPrompt } from './utils';
import { getReferencePDF, hasReferencePDF } from './reference-pdf';
import type { ResearchResult } from './research-agent';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ProposalContent {
  // Cover & Executive Summary
  coverPage: {
    title: string;
    subtitle: string;
    companyName: string;
    preparedFor: string;
    date: string;
  };

  executiveSummary: {
    overview: string;
    keyFindings: string[];
    recommendedStrategy: string;
    expectedOutcomes: string[];
  };

  // Situation Analysis
  currentSituation: {
    digitalPresence: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };

  // Strategy & Approach
  recommendedStrategy: {
    strategyOverview: string;
    coreObjectives: string[];
    keyPillars: string[];
    timeline: string;
  };

  // Technical SEO
  technicalSEO: {
    overview: string;
    priorities: Array<{
      title: string;
      description: string;
      impact: string;
    }>;
  };

  // Content Strategy
  contentStrategy: {
    overview: string;
    contentPillars: Array<{
      pillar: string;
      topics: string[];
      keywords: string[];
    }>;
    contentCalendar: string;
  };

  // Local SEO (for local/regional packages)
  localSEO?: {
    overview: string;
    tactics: string[];
    locationPages: Array<{
      location: string;
      keywords: string[];
      contentStrategy: string;
    }>;
  };

  // Link Building
  linkBuilding: {
    overview: string;
    strategy: string;
    tactics: string[];
    expectedAcquisition: string;
  };

  // Package Details
  packageOptions: Array<{
    tier: 'local' | 'regional' | 'national';
    name: string;
    monthlyInvestment: number;
    deliverables: string[];
    keywordCount: number;
    contentPerMonth: number;
    backlinksPerMonth: number;
  }>;

  // Projections & ROI
  projections: {
    month6: {
      traffic: number;
      leads: number;
      revenue: number;
    };
    month12: {
      traffic: number;
      leads: number;
      revenue: number;
    };
    roi: {
      percentage: number;
      paybackPeriod: string;
      lifetimeValue: number;
    };
  };

  // Next Steps
  nextSteps: {
    immediate: string[];
    onboarding: string[];
    kickoff: string;
  };

  // ============================================================================
  // NEW: A1 Mobility Design Elements (Structured Data for Visual Components)
  // ============================================================================
  // NOTE: These fields are optional - Claude may not populate them initially

  // Brutal Truth / Warning Callouts (orange/yellow boxes with provocative statements)
  brutalTruthCallouts?: Array<{
    title: string; // e.g., "THE BRUTAL TRUTH:", "THE REALITY:"
    content: string; // The hard-hitting message
    type: 'warning' | 'info'; // warning = orange, info = cyan
  }>;

  // Statistics Comparison Cards (large numbers side-by-side)
  statisticsCards?: Array<{
    currentNumber: string; // e.g., "174"
    currentLabel: string; // e.g., "monthly visitors"
    targetNumber: string; // e.g., "5,000+"
    targetLabel: string; // e.g., "competitor average"
    context?: string; // Optional explanation
  }>;

  // "The Simple Math" ROI Breakdown (step-by-step calculation)
  simpleMathBreakdown?: {
    steps: Array<{
      month: string; // e.g., "Month 6", "Month 12"
      traffic: number;
      leads: number;
      customers: number;
      revenue: number;
    }>;
    totalInvestment: number;
    totalReturn: number;
    roi: number;
  };

  // Competitive Comparison Table (structured competitor data)
  competitorComparison?: {
    metrics: Array<{
      metric: string; // e.g., "Monthly Traffic", "Domain Authority"
      yourBusiness: string;
      topCompetitorA: string;
      topCompetitorB: string;
      marketLeader: string;
    }>;
  };

  // Market Opportunity Statement (highlighted key insight)
  marketOpportunity?: {
    title: string;
    currentState: string;
    opportunitySize: string;
    timeframe: string;
  };
}

export interface ContentGenerationRequest {
  researchData: ResearchResult;
  companyName: string;
  packageTier: 'local' | 'regional' | 'national';
  customInstructions?: string;
}

// ============================================================================
// God Prompt for Content Generation
// ============================================================================

const GOD_PROMPT = `You are an expert SEO strategist and proposal writer with 15+ years of experience.

**REFERENCE DOCUMENT PROVIDED**: I've attached the A1 Mobility SEO proposal PDF. Study it carefully to understand the TONE, WRITING STYLE, and CONTENT DEPTH that makes proposals convert. The PDF shows you what high-quality proposal content looks like.

## YOUR JOB: RESEARCH ANALYSIS & CONTENT STRATEGY

Your role is to analyze the research data and generate compelling, data-driven proposal CONTENT. The visual design and formatting will be handled separately - you focus on the substance.

## CONTENT STRATEGY (Learned from A1 Mobility Reference)

### 1. TONE & VOICE
- **Confident and Direct**: Never apologetic or tentative
- **Provocative Truth-Telling**: Don't sugarcoat problems - be brutally honest about current state
- **Urgency Creation**: Show what they're losing every month they delay
- **Personal Address**: Use "you" and "your business" constantly
- **Specific, Never Generic**: Every sentence must be specific to their situation
- **ROI-Focused**: Emphasize business outcomes, not just SEO vanity metrics

### 2. PERSUASIVE TECHNIQUES
- **Contrast & Comparison**: "You have X, your competitor has Y, let that sink in"
- **Fear of Missing Out**: "Every month you wait costs £XX,XXX in lost revenue"
- **Social Proof**: Reference industry benchmarks and similar businesses
- **Authority Signals**: Show deep industry knowledge through specificity
- **Clear Takeaways**: End sections with bottom-line statements

### 3. DATA REQUIREMENTS
For each section, you must provide:
- **Brutal Truth Callouts**: 3-5 provocative statements with shocking statistics
  * Example: "THE BRUTAL TRUTH: You're invisible online. 174 monthly visitors vs competitor's 5,000+"
- **Statistics Comparisons**: Side-by-side current vs target/competitor numbers
  * Example: "174 visitors (current)" vs "5,000+ visitors (opportunity)"
- **Competitive Analysis**: Detailed comparison showing where they rank vs competitors
- **ROI Calculations**: Step-by-step breakdown from traffic → leads → customers → revenue
- **Market Opportunity**: Clear statement of what they're missing and why it matters

### 4. CONTENT DEPTH
Match the A1 Mobility depth and specificity:
- Real numbers from research (no placeholders, no [COMPANY NAME])
- Detailed keyword lists with search volumes
- Specific competitor names and metrics
- Month-by-month projections with justification
- Industry-specific insights and terminology
- Technical SEO findings with specific issues identified
- Content strategy with actual topic suggestions
- Link building tactics with specific outreach methods

### 5. RESEARCH-TO-CONTENT TRANSFORMATION
Analyze the research data to populate:
- **brutalTruthCallouts**: Find the most shocking gaps/opportunities in the data
  * Must be provocative and use real numbers from research
  * Example: "THE BRUTAL TRUTH: When someone searches 'mobility scooters Blackpool', Millercare appears #1. You're invisible. They get 2,000+ monthly visitors while you get 174."
- **statisticsCards**: Extract key current vs target comparisons
  * Show the gap between current state and opportunity
  * Use real metrics: traffic, rankings, keywords, revenue
- **competitorComparison**: Build detailed table from competitor analysis
  * Must include at least 3-4 competitors from research
  * Show specific metrics where they're beating the client
- **simpleMathBreakdown**: Calculate realistic ROI progression
  * Step-by-step: Traffic → Leads → Customers → Revenue
  * Use industry-standard conversion rates (3-5% for leads, 20-30% close rate)
  * Show progression at Month 3, 6, and 12
- **marketOpportunity**: Synthesize the biggest opportunity into clear statement
  * Include market size if available from research
  * Show what they're currently missing

## A1 MOBILITY DESIGN ELEMENTS (MANDATORY)
You MUST populate ALL of these optional fields:
- brutalTruthCallouts: 2-3 hard-hitting callouts
- statisticsCards: 3 key comparisons
- simpleMathBreakdown: Complete ROI calculation
- competitorComparison: Full comparison table
- marketOpportunity: Market opportunity statement

These elements are what make the proposal convert. Without them, the proposal is generic.

## CRITICAL REQUIREMENTS
- Use REAL data from the research provided (no generic statements)
- All numbers must be realistic, specific, and justified
- Every claim must be supported by data or expert reasoning
- No fluff - every sentence adds specific, actionable value
- Match A1 Mobility's confident, direct tone
- Focus on business impact, not just SEO tactics

## OUTPUT FORMAT
Return a valid JSON object with all fields from the ProposalContent TypeScript interface. Populate EVERY field with high-quality, research-based content that matches the A1 Mobility standard.

**REMEMBER**: Study the A1 Mobility reference to understand what "high-quality proposal content" means. Then analyze the research data and create content that matches that standard. The visual design is handled separately - you focus on substance, tone, and persuasive power.`;

// ============================================================================
// Content Generator Implementation
// ============================================================================

/**
 * Generate complete proposal content from research data
 */
export async function generateProposalContent(
  request: ContentGenerationRequest
): Promise<ProposalContent> {
  const { researchData, companyName, packageTier, customInstructions } = request;

  // Build comprehensive context for Claude
  const userPrompt = sanitizeForPrompt(`
Generate a comprehensive SEO proposal for: **${companyName}**

## RESEARCH DATA

### Company Analysis
${JSON.stringify(researchData.companyAnalysis, null, 2)}

### Market Intelligence
${JSON.stringify(researchData.marketIntelligence, null, 2)}

### Competitor Analysis
${JSON.stringify(researchData.competitorAnalysis, null, 2)}

### Keyword Research
${JSON.stringify(researchData.keywordResearch, null, 2)}

${researchData.locationStrategy ? `### Location Strategy\n${JSON.stringify(researchData.locationStrategy, null, 2)}` : ''}

## PACKAGE TIER
${packageTier.toUpperCase()} Package
${getPackageDetails(packageTier)}

${customInstructions ? `## CUSTOM INSTRUCTIONS\n${customInstructions}` : ''}

## YOUR TASK

Generate ALL proposal content following this exact structure:

\`\`\`json
{
  "coverPage": {
    "title": "Comprehensive SEO Strategy Proposal",
    "subtitle": "Driving Sustainable Growth Through Strategic Search Visibility",
    "companyName": "${companyName}",
    "preparedFor": "[Contact Name if available, otherwise 'The Team at ${companyName}']",
    "date": "${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}"
  },

  "executiveSummary": {
    "overview": "[2-3 paragraphs summarizing the opportunity, current situation, and recommended approach]",
    "keyFindings": [
      "[3-5 bullet points of critical insights from research]"
    ],
    "recommendedStrategy": "[1 paragraph describing the core strategy]",
    "expectedOutcomes": [
      "[4-6 specific, measurable outcomes they can expect]"
    ]
  },

  "currentSituation": {
    "digitalPresence": "[Detailed analysis of their current digital footprint, using data from research]",
    "strengths": ["[3-4 current strengths]"],
    "weaknesses": ["[3-4 areas for improvement]"],
    "opportunities": ["[4-6 specific opportunities from research]"],
    "threats": ["[2-3 competitive or market threats]"]
  },

  "recommendedStrategy": {
    "strategyOverview": "[Comprehensive overview of the recommended approach, 3-4 paragraphs]",
    "coreObjectives": [
      "[4-5 specific, measurable objectives]"
    ],
    "keyPillars": [
      "[3-4 strategic pillars that support the objectives]"
    ],
    "timeline": "[Month-by-month breakdown of the 12-month strategy]"
  },

  "technicalSEO": {
    "overview": "[2 paragraphs on importance of technical foundation]",
    "priorities": [
      {
        "title": "[Priority area]",
        "description": "[What needs to be done]",
        "impact": "[Expected impact on performance]"
      }
    ]
  },

  "contentStrategy": {
    "overview": "[2-3 paragraphs on content approach]",
    "contentPillars": [
      {
        "pillar": "[Main topic/theme]",
        "topics": ["[3-5 specific topics]"],
        "keywords": ["[Related keywords from research]"]
      }
    ],
    "contentCalendar": "[Overview of monthly content production]"
  },

  ${packageTier !== 'national' ? `"localSEO": {
    "overview": "[2-3 paragraphs on local SEO importance for this business]",
    "tactics": ["[5-7 specific local SEO tactics]"],
    "locationPages": [
      {
        "location": "[City/area from research]",
        "keywords": ["[Location-specific keywords]"],
        "contentStrategy": "[Approach for this location]"
      }
    ]
  },` : ''}

  "linkBuilding": {
    "overview": "[2 paragraphs on link building approach]",
    "strategy": "[Detailed strategy based on industry and competitors]",
    "tactics": ["[4-6 specific link building tactics]"],
    "expectedAcquisition": "[Monthly link acquisition targets]"
  },

  "packageOptions": [
    ${generatePackageOptionsJSON(packageTier)}
  ],

  "projections": {
    "month6": {
      "traffic": [realistic number based on research],
      "leads": [realistic number],
      "revenue": [realistic number]
    },
    "month12": {
      "traffic": [realistic number, should be 2-3x month 6],
      "leads": [realistic number],
      "revenue": [realistic number]
    },
    "roi": {
      "percentage": [calculate ROI percentage],
      "paybackPeriod": "[e.g., '4-5 months']",
      "lifetimeValue": [calculate 12-month total value]
    }
  },

  "nextSteps": {
    "immediate": [
      "[3-4 immediate action items for both parties]"
    ],
    "onboarding": [
      "[4-5 onboarding steps if they proceed]"
    ],
    "kickoff": "[Description of the kickoff process and timeline]"
  },

  "brutalTruthCallouts": [
    {
      "title": "THE BRUTAL TRUTH:",
      "content": "[Hard-hitting statement about their current situation vs competitors - be provocative]",
      "type": "warning"
    },
    {
      "title": "THE REALITY:",
      "content": "[Another shocking insight from the research data]",
      "type": "warning"
    }
  ],

  "statisticsCards": [
    {
      "currentNumber": "[e.g., '174']",
      "currentLabel": "[e.g., 'monthly organic visitors']",
      "targetNumber": "[e.g., '2,000+']",
      "targetLabel": "[e.g., 'competitor average']",
      "context": "[Why this gap matters]"
    },
    {
      "currentNumber": "[another key metric]",
      "currentLabel": "[current state]",
      "targetNumber": "[target/competitor number]",
      "targetLabel": "[context]"
    }
  ],

  "simpleMathBreakdown": {
    "steps": [
      {
        "month": "Month 3",
        "traffic": [realistic number],
        "leads": [realistic number],
        "customers": [realistic number],
        "revenue": [realistic number]
      },
      {
        "month": "Month 6",
        "traffic": [realistic number],
        "leads": [realistic number],
        "customers": [realistic number],
        "revenue": [realistic number]
      },
      {
        "month": "Month 12",
        "traffic": [realistic number],
        "leads": [realistic number],
        "customers": [realistic number],
        "revenue": [realistic number]
      }
    ],
    "totalInvestment": [12 months x package price],
    "totalReturn": [sum of all revenue],
    "roi": [calculate percentage]
  },

  "competitorComparison": {
    "metrics": [
      {
        "metric": "Monthly Organic Traffic",
        "yourBusiness": "[current traffic]",
        "topCompetitorA": "[competitor A traffic]",
        "topCompetitorB": "[competitor B traffic]",
        "marketLeader": "[market leader traffic]"
      },
      {
        "metric": "Ranking Keywords",
        "yourBusiness": "[current keywords]",
        "topCompetitorA": "[competitor A keywords]",
        "topCompetitorB": "[competitor B keywords]",
        "marketLeader": "[market leader keywords]"
      },
      {
        "metric": "Domain Authority",
        "yourBusiness": "[current DA]",
        "topCompetitorA": "[competitor A DA]",
        "topCompetitorB": "[competitor B DA]",
        "marketLeader": "[market leader DA]"
      }
    ]
  },

  "marketOpportunity": {
    "title": "The £[X] Million Opportunity",
    "currentState": "[Current market position]",
    "opportunitySize": "[Size of the market/opportunity]",
    "timeframe": "[Timeline to capture it]"
  }
}
\`\`\`

IMPORTANT:
- Use ONLY data from the research provided
- All projections must be realistic and justified
- Tailor everything specifically to ${companyName}
- Focus on their unique market position and opportunities
- Write in a professional, confident tone
- No placeholders - every field must have real content
  `);

  // Load the A1 Mobility reference PDF
  const referencePdfBase64 = hasReferencePDF() ? getReferencePDF() : '';

  if (referencePdfBase64) {
    const pdfSizeKB = Math.round(referencePdfBase64.length * 0.75 / 1024); // base64 is ~33% larger than binary
    console.log(`[Content Generator] Using A1 Mobility reference PDF (${pdfSizeKB}KB) for quality matching`);
  } else {
    console.warn('[Content Generator] Reference PDF not available - proceeding without template');
  }

  // Call Claude with the reference PDF attached
  const response = await callClaudeForContent(GOD_PROMPT, userPrompt, {
    pdfBase64: referencePdfBase64,
  });

  // Extract and parse JSON from response
  const content = extractAndParseJSON<ProposalContent>(response.content);

  return content;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getPackageDetails(tier: 'local' | 'regional' | 'national'): string {
  const packages = {
    local: {
      investment: '£2,000/month',
      keywords: '15-20',
      content: '8-12 pieces',
      backlinks: '10-15',
      locations: '3-5 local areas',
    },
    regional: {
      investment: '£3,000/month',
      keywords: '25-35',
      content: '12-16 pieces',
      backlinks: '15-25',
      locations: '5-10 regional locations',
    },
    national: {
      investment: '£5,000/month',
      keywords: '40-60',
      content: '20-30 pieces',
      backlinks: '25-40',
      locations: 'National coverage',
    },
  };

  const details = packages[tier];
  return `
Monthly Investment: ${details.investment}
Target Keywords: ${details.keywords}
Monthly Content: ${details.content}
Monthly Backlinks: ${details.backlinks}
Geographic Coverage: ${details.locations}
  `;
}

function generatePackageOptionsJSON(recommendedTier: string): string {
  const allPackages = [
    {
      tier: 'local',
      name: 'Local Dominance',
      monthlyInvestment: 2000,
      deliverables: [
        '15-20 target keywords',
        '8-12 optimized content pieces per month',
        '10-15 high-quality backlinks per month',
        '3-5 local area pages',
        'Google Business Profile optimization',
        'Monthly reporting & strategy calls',
      ],
      keywordCount: 20,
      contentPerMonth: 12,
      backlinksPerMonth: 15,
    },
    {
      tier: 'regional',
      name: 'Regional Authority',
      monthlyInvestment: 3000,
      deliverables: [
        '25-35 target keywords',
        '12-16 optimized content pieces per month',
        '15-25 high-quality backlinks per month',
        '5-10 regional location pages',
        'Advanced technical SEO',
        'Competitor monitoring',
        'Bi-weekly reporting & strategy calls',
      ],
      keywordCount: 35,
      contentPerMonth: 16,
      backlinksPerMonth: 25,
    },
    {
      tier: 'national',
      name: 'National Leader',
      monthlyInvestment: 5000,
      deliverables: [
        '40-60 target keywords',
        '20-30 optimized content pieces per month',
        '25-40 high-quality backlinks per month',
        'National coverage strategy',
        'Enterprise technical SEO',
        'PR & digital outreach',
        'Weekly reporting & dedicated account manager',
      ],
      keywordCount: 60,
      contentPerMonth: 30,
      backlinksPerMonth: 40,
    },
  ];

  return allPackages.map(pkg => JSON.stringify(pkg)).join(',\n    ');
}

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
    console.error('Failed to parse proposal content:', content.substring(0, 500));
    throw new Error(`Invalid JSON in proposal content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
