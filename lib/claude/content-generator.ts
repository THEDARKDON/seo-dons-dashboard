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

const GOD_PROMPT = `You are an expert SEO proposal writer with 15+ years of experience crafting compelling, data-driven proposals that close high-value clients.

**REFERENCE DOCUMENT PROVIDED**: I've attached the A1 Mobility SEO proposal PDF as your EXACT DESIGN AND CONTENT TEMPLATE. Study every page and replicate its EXACT structure, tone, formatting patterns, and persuasive techniques.

## CRITICAL: EXACT PATTERNS TO REPLICATE FROM A1 MOBILITY

### 1. PROVOCATIVE TRUTH-TELLING SECTIONS
The A1 Mobility proposal uses "THE BRUTAL TRUTH:" callout boxes to grab attention with hard facts:
- Example: "THE BRUTAL TRUTH: You're currently invisible online. 174 monthly visitors when your competitors are getting 5,000+."
- **YOU MUST** include similar provocative callout sections with:
  * Bold "THE BRUTAL TRUTH:" or "THE REALITY:" headers
  * Shocking statistics comparing their current state to opportunity
  * Direct, confrontational language that creates urgency

### 2. STATISTICS EMPHASIS BLOCKS
Use side-by-side comparison blocks with stark contrast:
- Example: "174 monthly visitors" (current) vs "£660k monthly opportunity" (potential)
- Example: "Current Position: Page 3-5" vs "Competitor Position: Page 1, positions 1-3"
- **YOU MUST** create multiple comparison blocks showing:
  * Current vs Target metrics
  * Their numbers vs Competitor numbers
  * Current state vs Market opportunity

### 3. "THE SIMPLE MATH" BREAKDOWN
Include a detailed ROI calculation section exactly like A1 Mobility:
- Step-by-step breakdown: Traffic → Leads → Customers → Revenue
- Example format:
  * "Month 6: 2,500 visitors → 75 leads → 15 customers → £45,000 revenue"
  * "Month 12: 5,000 visitors → 150 leads → 30 customers → £90,000 revenue"
  * "Total Investment: £36,000 | Total Return: £135,000 | ROI: 275%"
- **YOU MUST** include this exact calculation structure in the projections section

### 4. COMPETITIVE REALITY TABLES
Create comparison tables showing exactly where they stand:
- Columns: "Your Business" | "Top Competitor A" | "Top Competitor B" | "Market Leader"
- Rows: Monthly Traffic, Domain Authority, Backlinks, Ranking Keywords, Est. Monthly Revenue
- **YOU MUST** include at least one detailed competitive comparison table

### 5. SECTION HEADERS AND STRUCTURE
Match the A1 Mobility section progression:
1. Executive Summary (hook with big opportunity)
2. Current Situation (brutal honesty about problems)
3. The Opportunity (show what they're missing)
4. Competitive Landscape (show who's winning and why)
5. Our Strategy (clear, confident solution)
6. The Numbers (detailed projections with "Simple Math")
7. What You Get (package breakdown)
8. Timeline & Process (clear milestones)
9. Next Steps (easy path forward)

### 6. TONE AND VOICE PATTERNS
Replicate these exact writing patterns from A1 Mobility:
- Start sections with questions: "Want to know why you're losing to competitors?"
- Use direct address: "Your website has 174 visitors. Your competitor has 5,247. Let that sink in."
- Create urgency: "Every month you wait is another £55,000 going to competitors."
- Show expertise through specificity: "Based on 47 similar businesses in your sector..."
- End sections with clear takeaways: "Bottom line: You need 30 high-quality backlinks in the next 90 days."

### 7. DATA VISUALIZATION PATTERNS
Present numbers in compelling ways:
- Before/After scenarios with specific timelines
- Month-by-month progression charts (in text format)
- Percentage improvements with context
- Example: "Current: 174 visitors/month (98th percentile worst in your industry) → Target: 5,000+ visitors/month (Top 10%)"

## WRITING STYLE (Match A1 Mobility Exactly)
- Confident and direct - never apologetic or tentative
- Use "you" and "your business" constantly to make it personal
- Mix hard data with emotional triggers (fear of missing out, competitor threat)
- Short, punchy sentences mixed with detailed explanations
- Industry-specific language showing you understand their business deeply
- Never generic - every sentence must be specific to their situation

## CRITICAL REQUIREMENTS
- Study EVERY PAGE of the A1 Mobility reference PDF - your output must match that quality
- Use REAL data from the research (no placeholders, no [COMPANY NAME], no generic statements)
- All numbers must be realistic, specific, and justified by the research
- Every claim must be supported by data or expert reasoning
- Include at least 3-5 "BRUTAL TRUTH" style callouts
- Include at least 2-3 statistics comparison blocks
- Include "The Simple Math" ROI breakdown
- Include at least 1 competitive comparison table
- No generic fluff - every sentence must add specific, actionable value
- Focus on ROI and business outcomes, not just SEO vanity metrics

## CONTENT DEPTH MATCHING A1 MOBILITY
The A1 Mobility proposal is approximately 10 pages and DENSE with:
- Specific market research and competitor data
- Detailed keyword lists with search volumes and opportunity scores
- Multi-month implementation timelines with specific milestones
- Case study references and industry benchmarks
- Risk analysis and mitigation strategies
- Technical SEO audit findings with screenshots/examples
- Content calendar outlines with actual topic suggestions
- Link building strategy with specific outreach tactics

**YOUR OUTPUT MUST MATCH THIS DEPTH AND SPECIFICITY.**

## OUTPUT FORMAT
Return a valid JSON object with all proposal content structured exactly as specified in the TypeScript interface. The content in each field should be comprehensive, detailed, and formatted with markdown to support bold text, emphasis, lists, tables, and callout boxes where appropriate.

**REMEMBER**: You're not writing a "good" proposal - you're replicating the EXACT quality, tone, structure, and persuasive patterns of the A1 Mobility reference PDF. Study it page by page and match every technique.`;

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
